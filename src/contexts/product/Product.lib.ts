import 'server-only';

import { db, type Tx } from '@/infrastructure/database/client';
import { ApplicationError } from '@/shared/api/errors';
import { assertUniqueInProject } from '@/shared/api/repository';
import { ORDER_CANCELLED_STATUSES } from '@/contexts/order/Order.types';
import { orderItems, orders } from '@/contexts/order/Orders.table';
import { projectBadges } from '@/contexts/projectBadge/ProjectBadges.table';
import { projectCategories } from '@/contexts/projectCategory/ProjectCategories.table';
import type { ManualStockChange } from '@/contexts/stockMovement/StockMovement.types';
import { assertPlanLimit } from '@/contexts/subscription/Subscription.lib';
import {
    and,
    asc,
    count,
    eq,
    inArray,
    isNull,
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
    type NewProductVariantRecord,
    type ProductVariantRecord,
    type ProductView,
    productBadges,
    productPerformers,
    products,
    productVariants,
} from './Products.table';

type ProductRelations = Pick<
    ProductView,
    'variants' | 'badges' | 'performerIds' | 'soldCount'
>;

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

export async function replaceProductPerformers(
    tx: Tx,
    product: ProductRef,
    organizationId: string,
    employeeIds: string[],
): Promise<void> {
    await tx
        .delete(productPerformers)
        .where(eq(productPerformers.productId, product.id));

    const unique = [...new Set(employeeIds)];

    if (unique.length === 0) return;

    await tx.insert(productPerformers).values(
        unique.map((employeeId) => ({
            productId: product.id,
            employeeId,
            projectId: product.projectId,
            organizationId,
        })),
    );
}

export async function saveProductVariants(
    tx: Tx,
    product: ProductRef,
    records: NewProductVariantRecord[],
    existing: ProductVariantRecord[],
    createdBy: string,
): Promise<ManualStockChange[]> {
    const keptIds = records.flatMap((record) => record.id ?? []);
    const added = records.filter((record) => record.id === undefined);

    if (existing.length > 0) {
        await tx
            .delete(productVariants)
            .where(
                and(
                    eq(productVariants.productId, product.id),
                    keptIds.length > 0
                        ? notInArray(productVariants.id, keptIds)
                        : undefined,
                ),
            );
    }

    const stockBefore = new Map(
        existing.map((variant) => [variant.id, variant.stock]),
    );

    const saved: Pick<ProductVariantRecord, 'id' | 'stock'>[] = [];

    for (const { id, ...record } of records) {
        if (id === undefined) continue;

        const [row] = await tx
            .update(productVariants)
            .set(record)
            .where(
                and(
                    eq(productVariants.id, id),
                    eq(productVariants.productId, product.id),
                ),
            )
            .returning({
                id: productVariants.id,
                stock: productVariants.stock,
            });

        if (row) saved.push(row);
    }

    if (added.length > 0) {
        saved.push(
            ...(await tx.insert(productVariants).values(added).returning({
                id: productVariants.id,
                stock: productVariants.stock,
            })),
        );
    }

    return saved.map((variant) => {
        const before = stockBefore.get(variant.id) ?? null;

        return {
            projectId: product.projectId,
            productId: product.id,
            variantId: variant.id,
            before,
            after: variant.stock,
            note: before === null ? 'Начальный остаток варианта' : null,
            createdBy,
        };
    });
}

export async function loadVariants(
    productIds: string[],
): Promise<Map<string, ProductVariantRecord[]>> {
    const rows = await db
        .select()
        .from(productVariants)
        .where(inArray(productVariants.productId, productIds))
        .orderBy(asc(productVariants.position));

    return Map.groupBy(rows, (row) => row.productId);
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
    const [variants, badgeRows, performerRows, soldCounts] = await Promise.all([
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
        db
            .select({
                productId: productPerformers.productId,
                employeeId: productPerformers.employeeId,
            })
            .from(productPerformers)
            .where(inArray(productPerformers.productId, productIds)),
        loadSoldCounts(productIds),
    ]);

    const badges = Map.groupBy(badgeRows, (row) => row.productId);
    const performers = Map.groupBy(performerRows, (row) => row.productId);

    return (productId) => ({
        variants: variants.get(productId) ?? [],
        badges: badges.get(productId)?.map((row) => row.code) ?? [],
        performerIds:
            performers.get(productId)?.map((row) => row.employeeId) ?? [],
        soldCount: soldCounts.get(productId) ?? 0,
    });
}

export async function withRelations<T extends { id: string }>(
    product: T,
): Promise<T & ProductRelations> {
    const relationsOf = await loadProductRelations([product.id]);

    return { ...product, ...relationsOf(product.id) };
}
