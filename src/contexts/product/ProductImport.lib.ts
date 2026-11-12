import 'server-only';

import { db } from '@/infrastructure/database/client';
import {
    ApplicationError,
    constraintErrorMessage,
    isApplicationError,
} from '@/shared/api/errors';
import { insertOne } from '@/shared/api/repository';
import { slugify } from '@/shared/format/url';
import { projectDefaultCurrency } from '@/contexts/project/Project.lib';
import { projectCategories } from '@/contexts/projectCategory/ProjectCategories.table';
import { countStock } from '@/contexts/stockMovement/StockOperation.lib';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { assertProductLimit } from './Product.lib';
import { isCategoryCompatible, ProductType } from './Product.types';
import type {
    ProductImportResult,
    ProductImportRow,
} from './ProductImport.types';
import { products, productVariants } from './Products.table';

interface ImportTarget {
    projectId: string;
    organizationId: string;
    warehouseId: string;
    createdBy: string;
}

const uniqueSlug = (
    base: string,
    fallback: string,
    taken: Set<string>,
): string => {
    const root = slugify(base, 130) || fallback.toLowerCase();
    let slug = root;

    for (let index = 2; taken.has(slug); index += 1) slug = `${root}-${index}`;

    taken.add(slug);

    return slug;
};

const failureOf = (error: unknown): string => {
    if (isApplicationError(error)) return error.message;

    return constraintErrorMessage(error) ?? 'Не удалось сохранить строку';
};

const loadImportState = async (projectId: string, skus: string[]) => {
    const [existing, slugs, categories] = await Promise.all([
        db
            .select({ id: products.id, sku: products.sku })
            .from(products)
            .where(
                and(
                    eq(products.projectId, projectId),
                    inArray(products.sku, skus),
                    isNull(products.deletedAt),
                ),
            ),
        db
            .select({ slug: products.slug })
            .from(products)
            .where(
                and(
                    eq(products.projectId, projectId),
                    isNull(products.deletedAt),
                ),
            ),
        db
            .select({
                id: projectCategories.id,
                name: projectCategories.name,
                slug: projectCategories.slug,
                type: projectCategories.type,
            })
            .from(projectCategories)
            .where(
                and(
                    eq(projectCategories.projectId, projectId),
                    isNull(projectCategories.deletedAt),
                ),
            ),
    ]);

    const withVariants = await db
        .selectDistinct({ productId: productVariants.productId })
        .from(productVariants)
        .where(
            inArray(
                productVariants.productId,
                existing.map((row) => row.id),
            ),
        );

    return {
        productIdBySku: new Map(existing.map((row) => [row.sku, row.id])),
        takenSlugs: new Set(slugs.map((row) => row.slug)),
        categoryByName: new Map(
            categories.map((row) => [row.name.toLowerCase(), row]),
        ),
        categorySlugs: new Set(categories.map((row) => row.slug)),
        variantProductIds: new Set(withVariants.map((row) => row.productId)),
    };
};

export const importProducts = async (
    target: ImportTarget,
    rows: ProductImportRow[],
): Promise<ProductImportResult> => {
    const { projectId } = target;

    const state = await loadImportState(
        projectId,
        rows.map((row) => row.sku),
    );

    const newCount = rows.filter(
        (row) => !state.productIdBySku.has(row.sku),
    ).length;

    const [currency] = await Promise.all([
        projectDefaultCurrency(projectId),
        newCount > 0 &&
            assertProductLimit(target.organizationId, projectId, newCount),
    ]);

    const categoryIdOf = async (name: string | null) => {
        if (!name) return undefined;

        const known = state.categoryByName.get(name.toLowerCase());

        if (known) {
            if (!isCategoryCompatible(ProductType.PHYSICAL, known.type)) {
                throw new ApplicationError(`Категория «${name}» — для услуг`);
            }

            return known.id;
        }

        const created = await insertOne(
            projectCategories,
            {
                projectId,
                name,
                slug: uniqueSlug(name, 'category', state.categorySlugs),
                position: state.categoryByName.size,
            },
            `Не удалось создать категорию «${name}»`,
        );

        state.categoryByName.set(name.toLowerCase(), created);

        return created.id;
    };

    const result: ProductImportResult = { created: 0, updated: 0, failed: [] };

    for (const row of rows) {
        try {
            const categoryId = await categoryIdOf(row.category);
            const existingId = state.productIdBySku.get(row.sku);

            await db.transaction(async (tx) => {
                const productId = existingId
                    ? existingId
                    : (
                          await insertOne(
                              products,
                              {
                                  projectId,
                                  name: row.name,
                                  slug: uniqueSlug(
                                      row.name,
                                      row.sku,
                                      state.takenSlugs,
                                  ),
                                  sku: row.sku,
                                  barcode: row.barcode,
                                  price: row.price,
                                  costAmount: row.costAmount,
                                  currency,
                                  description: row.description,
                                  categoryId: categoryId ?? null,
                              },
                              'Не удалось создать товар',
                              tx,
                          )
                      ).id;

                if (existingId) {
                    await tx
                        .update(products)
                        .set({
                            name: row.name,
                            price: row.price,
                            costAmount: row.costAmount ?? undefined,
                            barcode: row.barcode ?? undefined,
                            description: row.description ?? undefined,
                            categoryId,
                        })
                        .where(eq(products.id, existingId));
                }

                if (row.stock === null) return;

                if (state.variantProductIds.has(productId)) {
                    throw new ApplicationError(
                        'У товара есть варианты — остаток задайте на складе',
                    );
                }

                await countStock(tx, {
                    projectId,
                    productId,
                    variantId: null,
                    warehouseId: target.warehouseId,
                    quantity: row.stock,
                    note: 'Импорт из CSV',
                    createdBy: target.createdBy,
                });
            });

            if (existingId) result.updated += 1;
            else result.created += 1;
        } catch (error) {
            result.failed.push({ sku: row.sku, message: failureOf(error) });
        }
    }

    return result;
};
