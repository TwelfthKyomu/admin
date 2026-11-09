import 'server-only';

import { db, type Tx } from '@/infrastructure/database/client';
import { ApplicationError } from '@/shared/api/errors';
import { assertUniqueInProject } from '@/shared/api/repository';
import { ORDER_CANCELLED_STATUSES } from '@/contexts/order/Order.types';
import { orderItems, orders } from '@/contexts/order/Orders.table';
import { projectBadges } from '@/contexts/projectBadge/ProjectBadges.table';
import { projectCategories } from '@/contexts/projectCategory/ProjectCategories.table';
import { assertPlanLimit } from '@/contexts/subscription/Subscription.lib';
import {
    and,
    asc,
    count,
    eq,
    inArray,
    isNull,
    ne,
    notInArray,
    sum,
} from 'drizzle-orm';
import {
    isCategoryCompatible,
    normalizeProductBadges,
    type ProductRef,
    type ProductType,
} from './Product.types';
import {
    type ProductView,
    productBadges,
    products,
    productVariants,
} from './Products.table';
import { loadVariants } from './ProductVariant.lib';

type ProductRelations = Pick<ProductView, 'variants' | 'badges' | 'soldCount'>;

export async function assertProductLimit(
    organizationId: string,
    projectId: string,
): Promise<void> {
    const [used] = await db
        .select({ value: count() })
        .from(products)
        .where(
            and(eq(products.projectId, projectId), isNull(products.deletedAt)),
        );

    await assertPlanLimit(
        organizationId,
        'productsPerProject',
        used?.value ?? 0,
        'товаров',
    );
}

export async function assertCategoryCompatible(
    projectId: string,
    categoryId: string | null,
    productType: ProductType,
): Promise<void> {
    if (!categoryId) return;

    const [category] = await db
        .select({ type: projectCategories.type, name: projectCategories.name })
        .from(projectCategories)
        .where(
            and(
                eq(projectCategories.id, categoryId),
                eq(projectCategories.projectId, projectId),
                isNull(projectCategories.deletedAt),
            ),
        )
        .limit(1);

    if (!category) throw new ApplicationError('Категория не найдена');

    if (!isCategoryCompatible(productType, category.type)) {
        throw new ApplicationError(
            `Категория «${category.name}» (${category.type}) несовместима с типом товара «${productType}»`,
        );
    }
}

export async function assertProductCodesFree(
    projectId: string,
    codes: { slug?: string; sku?: string },
    excludeId?: string,
): Promise<void> {
    await Promise.all([
        codes.slug &&
            assertUniqueInProject({
                table: products,
                column: products.slug,
                value: codes.slug,
                projectId,
                excludeId,
                conflict: `Товар со slug «${codes.slug}» уже существует`,
            }),
        codes.sku &&
            assertUniqueInProject({
                table: products,
                column: products.sku,
                value: codes.sku,
                projectId,
                excludeId,
                conflict: `Товар с SKU «${codes.sku}» уже существует`,
            }),
    ]);
}

export async function assertBarcodesFree(
    projectId: string,
    barcodes: (string | null | undefined)[],
    excludeProductId?: string,
): Promise<void> {
    const codes = barcodes.filter((code): code is string => Boolean(code));
    const repeated = codes.find((code, index) => codes.indexOf(code) !== index);

    if (repeated) {
        throw new ApplicationError(`Штрихкод «${repeated}» указан дважды`);
    }
    if (codes.length === 0) return;

    const [[product], [variant]] = await Promise.all([
        db
            .select({ barcode: products.barcode })
            .from(products)
            .where(
                and(
                    eq(products.projectId, projectId),
                    inArray(products.barcode, codes),
                    isNull(products.deletedAt),
                    excludeProductId
                        ? ne(products.id, excludeProductId)
                        : undefined,
                ),
            )
            .limit(1),
        db
            .select({ barcode: productVariants.barcode })
            .from(productVariants)
            .where(
                and(
                    eq(productVariants.projectId, projectId),
                    inArray(productVariants.barcode, codes),
                    excludeProductId
                        ? ne(productVariants.productId, excludeProductId)
                        : undefined,
                ),
            )
            .limit(1),
    ]);

    const taken = product?.barcode ?? variant?.barcode;

    if (taken) {
        throw new ApplicationError(
            `Штрихкод «${taken}» уже есть у другого товара`,
        );
    }
}

export async function resolveBadgeIds(
    projectId: string,
    codes: string[],
): Promise<string[]> {
    const normalized = normalizeProductBadges(codes);

    if (normalized.length === 0) return [];

    const known = await db
        .select({ id: projectBadges.id, code: projectBadges.code })
        .from(projectBadges)
        .where(
            and(
                eq(projectBadges.projectId, projectId),
                inArray(projectBadges.code, normalized),
                isNull(projectBadges.deletedAt),
            ),
        );

    const idByCode = new Map(known.map((badge) => [badge.code, badge.id]));
    const missing = normalized.filter((code) => !idByCode.has(code));

    if (missing.length > 0) {
        throw new ApplicationError(
            `Бейджи не найдены в каталоге проекта: ${missing.join(', ')}`,
        );
    }

    return normalized.flatMap((code) => idByCode.get(code) ?? []);
}

export async function replaceProductBadges(
    tx: Tx,
    product: ProductRef,
    badgeIds: string[],
): Promise<void> {
    await tx
        .delete(productBadges)
        .where(eq(productBadges.productId, product.id));

    if (badgeIds.length === 0) return;

    await tx.insert(productBadges).values(
        badgeIds.map((badgeId, position) => ({
            productId: product.id,
            badgeId,
            projectId: product.projectId,
            position,
        })),
    );
}

export async function loadSoldCounts(
    productIds: string[],
): Promise<Map<string, number>> {
    const rows = await db
        .select({
            productId: orderItems.productId,
            sold: sum(orderItems.quantity).mapWith(Number),
        })
        .from(orderItems)
        .innerJoin(orders, eq(orders.id, orderItems.orderId))
        .where(
            and(
                inArray(orderItems.productId, productIds),
                notInArray(orders.status, [...ORDER_CANCELLED_STATUSES]),
            ),
        )
        .groupBy(orderItems.productId);

    return new Map(
        rows.flatMap((row): [string, number][] =>
            row.productId ? [[row.productId, row.sold]] : [],
        ),
    );
}

export async function loadProductRelations(
    productIds: string[],
): Promise<(productId: string) => ProductRelations> {
    const [variants, badgeRows, soldCounts] = await Promise.all([
        loadVariants(productIds),
        db
            .select({
                productId: productBadges.productId,
                code: projectBadges.code,
            })
            .from(productBadges)
            .innerJoin(
                projectBadges,
                eq(projectBadges.id, productBadges.badgeId),
            )
            .where(inArray(productBadges.productId, productIds))
            .orderBy(asc(productBadges.position)),
        loadSoldCounts(productIds),
    ]);

    const badges = Map.groupBy(badgeRows, (row) => row.productId);

    return (productId) => ({
        variants: variants.get(productId) ?? [],
        badges: badges.get(productId)?.map((row) => row.code) ?? [],
        soldCount: soldCounts.get(productId) ?? 0,
    });
}

export async function withRelations<T extends { id: string }>(
    product: T,
): Promise<T & ProductRelations> {
    const relationsOf = await loadProductRelations([product.id]);

    return { ...product, ...relationsOf(product.id) };
}
