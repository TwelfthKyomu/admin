'use server';

import { db } from '@/infrastructure/database/client';
import {
    projectMutationAction,
    projectReadAction,
} from '@/shared/api/action-client';
import { ApplicationError } from '@/shared/api/errors';
import {
    findInProject,
    insertOne,
    searchFilters,
    softDeleteInProject,
    updateOne,
} from '@/shared/api/repository';
import { SLUG_MAX } from '@/shared/constants/default';
import { slugify } from '@/shared/format/url';
import { mapDefined } from '@/shared/lib/utils';
import { SLUG_PATTERN } from '@/shared/validation';
import { projectDefaultCurrency } from '@/contexts/project/Project.lib';
import { cleanupProjectFiles } from '@/contexts/projectFile/ProjectFile.lib';
import { recordManualStockChanges } from '@/contexts/stockMovement/StockMovement.lib';
import {
    CATALOG_READ_PERMISSIONS,
    Permission,
} from '@/contexts/user/User.types';
import { and, asc, eq, isNull } from 'drizzle-orm';
import {
    assertCategoryCompatible,
    assertProductCodesFree,
    assertProductLimit,
    loadProductRelations,
    loadVariants,
    replaceProductBadges,
    resolveBadgeIds,
    saveProductVariants,
    withRelations,
} from './Product.lib';
import {
    CreateProductActionInputSchema,
    DeleteProductActionInputSchema,
    ProductsActionInputSchema,
    parseProductAttributes,
    UpdateProductActionInputSchema,
} from './Product.schema';
import {
    assertVariantIdsOwned,
    assertVariantsMatchOptions,
    buildVariantRecords,
    normalizeProductOptions,
    ProductType,
} from './Product.types';
import { type ProductRecord, products } from './Products.table';

function findProductInProject(
    id: string,
    projectId: string,
): Promise<ProductRecord> {
    return findInProject(products, id, projectId, 'Товар не найден');
}

export const productsAction = projectReadAction(CATALOG_READ_PERMISSIONS)
    .inputSchema(ProductsActionInputSchema)
    .action(async ({ parsedInput: { projectId, search } }) => {
        const filters = [
            eq(products.projectId, projectId),
            isNull(products.deletedAt),
        ];

        filters.push(
            ...searchFilters(search, [
                products.name,
                products.slug,
                products.sku,
            ]),
        );

        const rows = await db
            .select()
            .from(products)
            .where(and(...filters))
            .orderBy(asc(products.name));

        const relationsOf = await loadProductRelations(
            rows.map((row) => row.id),
        );

        return rows.map((row) => ({ ...row, ...relationsOf(row.id) }));
    });

export const createProductAction = projectMutationAction(
    Permission.MANAGE_CATALOG,
)
    .inputSchema(CreateProductActionInputSchema)
    .action(async ({ parsedInput, ctx: { userId, organizationId } }) => {
        const { projectId } = parsedInput;
        const type = parsedInput.type ?? ProductType.PHYSICAL;

        const name = parsedInput.name.trim();

        const slug = (
            parsedInput.slug ?? slugify(name, SLUG_MAX)
        ).toLowerCase();

        if (!SLUG_PATTERN.test(slug) || slug.length > SLUG_MAX) {
            throw new ApplicationError(`Неверный slug: ${slug}`);
        }

        const categoryId = parsedInput.categoryId ?? null;

        const attributes = parseProductAttributes(type, parsedInput.attributes);
        const options = normalizeProductOptions(parsedInput.options ?? []);

        const stock =
            type === ProductType.SERVICE ? null : (parsedInput.stock ?? null);

        const [badgeIds, currency] = await Promise.all([
            resolveBadgeIds(projectId, parsedInput.badges ?? []),
            parsedInput.currency ?? projectDefaultCurrency(projectId),
            assertProductLimit(organizationId, projectId),
            assertCategoryCompatible(projectId, categoryId, type),
            assertProductCodesFree(projectId, { slug, sku: parsedInput.sku }),
        ]);

        const created = await db.transaction(async (tx) => {
            const product = await insertOne(
                products,
                {
                    projectId,
                    categoryId,
                    type,
                    name,
                    slug,
                    sku: parsedInput.sku,
                    description: parsedInput.description?.trim() || null,
                    price: parsedInput.price,
                    currency,
                    status: parsedInput.status,
                    images: (parsedInput.images ?? []).filter(
                        (url) => url.length > 0,
                    ),
                    attributes,
                    isFeatured: parsedInput.isFeatured ?? false,
                    stock,
                    options,
                },
                'Не удалось создать товар',
                tx,
            );

            await replaceProductBadges(tx, product, badgeIds);

            const variantRecords = buildVariantRecords(
                product,
                parsedInput.variants ?? [],
            ).map((variant) => ({ ...variant, id: undefined }));

            assertVariantsMatchOptions(options, variantRecords);

            const variantChanges = await saveProductVariants(
                tx,
                product,
                variantRecords,
                [],
                userId,
            );

            await recordManualStockChanges(tx, [
                {
                    projectId: product.projectId,
                    productId: product.id,
                    variantId: null,
                    before: null,
                    after: stock,
                    note: 'Начальный остаток',
                    createdBy: userId,
                },
                ...variantChanges,
            ]);

            return product;
        });

        return withRelations(created);
    });

export const updateProductAction = projectMutationAction(
    Permission.MANAGE_CATALOG,
)
    .inputSchema(UpdateProductActionInputSchema)
    .action(async ({ parsedInput, ctx: { userId, organizationId } }) => {
        const product = await findProductInProject(
            parsedInput.id,
            parsedInput.projectId,
        );

        const nextType = parsedInput.type ?? product.type;

        const nextCategoryId =
            parsedInput.categoryId !== undefined
                ? parsedInput.categoryId
                : product.categoryId;

        const attributes =
            parsedInput.attributes !== undefined ||
            parsedInput.type !== undefined
                ? parseProductAttributes(
                      nextType,
                      parsedInput.attributes ?? product.attributes,
                  )
                : undefined;

        const dropsStock =
            nextType === ProductType.SERVICE && product.stock !== null;

        const options =
            parsedInput.options !== undefined
                ? normalizeProductOptions(parsedInput.options)
                : undefined;

        const variantRecords =
            parsedInput.variants !== undefined
                ? buildVariantRecords(product, parsedInput.variants)
                : undefined;

        const checksVariants =
            options !== undefined || variantRecords !== undefined;

        const [badgeIds, variantsByProduct] = await Promise.all([
            parsedInput.badges !== undefined
                ? resolveBadgeIds(product.projectId, parsedInput.badges)
                : undefined,
            checksVariants ? loadVariants([product.id]) : undefined,
            assertCategoryCompatible(
                product.projectId,
                nextCategoryId,
                nextType,
            ),
            assertProductCodesFree(
                product.projectId,
                {
                    slug:
                        parsedInput.slug !== product.slug
                            ? parsedInput.slug
                            : undefined,
                    sku:
                        parsedInput.sku !== product.sku
                            ? parsedInput.sku
                            : undefined,
                },
                product.id,
            ),
        ]);

        const existingVariants = variantsByProduct?.get(product.id) ?? [];

        if (checksVariants) {
            if (variantRecords !== undefined) {
                assertVariantIdsOwned(variantRecords, existingVariants);
            }

            assertVariantsMatchOptions(
                options ?? product.options,
                variantRecords ?? existingVariants,
            );
        }

        const updated = await db.transaction(async (tx) => {
            const row = await updateOne(
                products,
                eq(products.id, product.id),
                {
                    name: parsedInput.name?.trim(),
                    slug: parsedInput.slug,
                    sku: parsedInput.sku,
                    description: mapDefined(
                        parsedInput.description,
                        (value) => value?.trim() || null,
                    ),
                    price: parsedInput.price,
                    currency: parsedInput.currency,
                    status: parsedInput.status,
                    categoryId: parsedInput.categoryId,
                    type: parsedInput.type,
                    ...(dropsStock && { stock: null }),
                    images: parsedInput.images?.filter((url) => url.length > 0),
                    attributes,
                    isFeatured: parsedInput.isFeatured,
                    options,
                },
                'Товар не найден',
                tx,
            );

            if (badgeIds !== undefined) {
                await replaceProductBadges(tx, product, badgeIds);
            }

            const variantChanges = variantRecords
                ? await saveProductVariants(
                      tx,
                      product,
                      variantRecords,
                      existingVariants,
                      userId,
                  )
                : [];

            await recordManualStockChanges(tx, [
                {
                    projectId: product.projectId,
                    productId: product.id,
                    variantId: null,
                    before: product.stock,
                    after: dropsStock ? null : product.stock,
                    note: 'Товар стал услугой',
                    createdBy: userId,
                },
                ...variantChanges,
            ]);

            return row;
        });

        if (parsedInput.images !== undefined) {
            await cleanupProjectFiles(
                organizationId,
                product.projectId,
                product.images.filter((url) => !updated.images.includes(url)),
            ).catch(() => undefined);
        }

        return withRelations(updated);
    });

export const deleteProductAction = projectMutationAction(
    Permission.MANAGE_CATALOG,
)
    .inputSchema(DeleteProductActionInputSchema)
    .action(
        async ({ parsedInput: { id, projectId }, ctx: { organizationId } }) => {
            const product = await findProductInProject(id, projectId);

            const result = await softDeleteInProject(
                products,
                id,
                projectId,
                'Товар не найден',
            );

            await cleanupProjectFiles(
                organizationId,
                projectId,
                product.images,
            ).catch(() => undefined);

            return result;
        },
    );
