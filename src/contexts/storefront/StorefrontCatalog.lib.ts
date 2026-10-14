import 'server-only';

import { db } from '@/infrastructure/database/client';
import { uploadUrl } from '@/infrastructure/storage/uploads';
import { searchFilters } from '@/shared/api/repository';
import { loadSoldCounts, loadVariants } from '@/contexts/product/Product.lib';
import {
    editionSizeOf,
    ProductStatus,
    type ProductType,
    SELLABLE_PRODUCT_STATUSES,
} from '@/contexts/product/Product.types';
import { productBadges, products } from '@/contexts/product/Products.table';
import { projectBadges } from '@/contexts/projectBadge/ProjectBadges.table';
import { projectCategories } from '@/contexts/projectCategory/ProjectCategories.table';
import { loadReservedStock } from '@/contexts/stockMovement/StockMovement.lib';
import { freeStock } from '@/contexts/stockMovement/StockMovement.types';
import {
    and,
    asc,
    count,
    desc,
    eq,
    gt,
    inArray,
    isNull,
    or,
} from 'drizzle-orm';
import { storefrontImageUrl } from './Storefront.lib';
import {
    CatalogSort,
    type StorefrontAccess,
    toMajorUnits,
} from './Storefront.types';

export function publicImageUrl(projectId: string, url: string): string {
    const prefix = `${uploadUrl(projectId, '')}`;

    return url.startsWith(prefix)
        ? storefrontImageUrl(projectId, url.slice(prefix.length))
        : url;
}

export interface LoadCatalogOptions {
    page?: number;
    limit?: number;
    categorySlug?: string;
    featured?: boolean;
    type?: ProductType;
    slug?: string;
    search?: string;
    inStock?: boolean;
    sort?: CatalogSort;
    ids?: string[];
}

const CATALOG_ORDER = {
    [CatalogSort.FEATURED]: [desc(products.isFeatured), asc(products.name)],
    [CatalogSort.NEWEST]: [desc(products.createdAt)],
    [CatalogSort.PRICE_ASC]: [asc(products.price), asc(products.name)],
    [CatalogSort.PRICE_DESC]: [desc(products.price), asc(products.name)],
};

export async function loadStorefrontCatalog(
    access: StorefrontAccess,
    options: LoadCatalogOptions = {},
) {
    const { projectId } = access;

    const categories = await db
        .select({
            id: projectCategories.id,
            parentId: projectCategories.parentId,
            name: projectCategories.name,
            slug: projectCategories.slug,
            position: projectCategories.position,
        })
        .from(projectCategories)
        .where(
            and(
                eq(projectCategories.projectId, projectId),
                eq(projectCategories.isActive, true),
                isNull(projectCategories.deletedAt),
            ),
        )
        .orderBy(asc(projectCategories.position));

    const categoryId = options.categorySlug
        ? categories.find(({ slug }) => slug === options.categorySlug)?.id
        : undefined;

    const filters = and(
        eq(products.projectId, projectId),
        options.slug
            ? inArray(products.status, SELLABLE_PRODUCT_STATUSES)
            : eq(products.status, ProductStatus.ACTIVE),
        isNull(products.deletedAt),
        options.categorySlug
            ? inArray(products.categoryId, categoryId ? [categoryId] : [])
            : undefined,
        options.featured ? eq(products.isFeatured, true) : undefined,
        options.type ? eq(products.type, options.type) : undefined,
        options.slug ? eq(products.slug, options.slug) : undefined,
        options.ids ? inArray(products.id, options.ids) : undefined,
        options.inStock
            ? or(isNull(products.stock), gt(products.stock, 0))
            : undefined,
        ...searchFilters(options.search, [products.name, products.description]),
    );

    const [productRows, [counted], badgeRows] = await Promise.all([
        db
            .select()
            .from(products)
            .where(filters)
            .orderBy(...CATALOG_ORDER[options.sort ?? CatalogSort.FEATURED])
            .limit(options.limit ?? 1000)
            .offset(
                options.page && options.limit
                    ? (options.page - 1) * options.limit
                    : 0,
            ),
        db.select({ total: count() }).from(products).where(filters),
        db
            .select({
                productId: productBadges.productId,
                code: projectBadges.code,
                label: projectBadges.label,
                color: projectBadges.color,
            })
            .from(productBadges)
            .innerJoin(
                projectBadges,
                eq(projectBadges.id, productBadges.badgeId),
            )
            .where(
                and(
                    eq(productBadges.projectId, projectId),
                    eq(projectBadges.isActive, true),
                    isNull(projectBadges.deletedAt),
                ),
            )
            .orderBy(asc(productBadges.position)),
    ]);

    const productIds = productRows.map((row) => row.id);

    const [soldCounts, variantsByProduct, reserved] = await Promise.all([
        loadSoldCounts(productIds),
        loadVariants(productIds),
        loadReservedStock(productIds),
    ]);

    const badgesByProduct = Map.groupBy(badgeRows, (row) => row.productId);

    return {
        currency: access.currency,
        total: counted?.total ?? 0,
        categories: categories.map((category) => ({
            ...category,
            parentId: category.parentId ?? undefined,
        })),
        products: productRows.map((product) => {
            const editionSize = editionSizeOf(product.attributes);

            return {
                id: product.id,
                type: product.type,
                name: product.name,
                slug: product.slug,
                description: product.description ?? undefined,
                price: toMajorUnits(product.price),
                currency: product.currency,
                categoryId: product.categoryId ?? undefined,
                images: product.images.map((url) =>
                    publicImageUrl(projectId, url),
                ),
                badges: (badgesByProduct.get(product.id) ?? []).map(
                    ({ productId: _, ...badge }) => badge,
                ),
                stock:
                    freeStock(product.stock, reserved.get(product.id)) ??
                    undefined,
                editionSize,
                soldCount:
                    editionSize === undefined
                        ? undefined
                        : (soldCounts.get(product.id) ?? 0),
                options: product.options,
                variants: (variantsByProduct.get(product.id) ?? [])
                    .filter((variant) => variant.isActive)
                    .map((variant) => ({
                        id: variant.id,
                        optionValues: variant.optionValues,
                        price: toMajorUnits(variant.price ?? product.price),
                        stock:
                            freeStock(
                                variant.stock,
                                reserved.get(variant.id),
                            ) ?? undefined,
                    })),
                isFeatured: product.isFeatured,
            };
        }),
    };
}
