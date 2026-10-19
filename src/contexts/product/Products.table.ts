import { nullOrNonNegative } from '@/infrastructure/database/checks';
import {
    createdAt,
    deletedAt,
    id,
    textArray,
} from '@/infrastructure/database/columns';
import {
    currencyEnum,
    productStatusEnum,
    productTypeEnum,
} from '@/infrastructure/database/schemas/enums';
import { projects } from '@/contexts/project/Projects.table';
import { projectBadges } from '@/contexts/projectBadge/ProjectBadges.table';
import { projectCategories } from '@/contexts/projectCategory/ProjectCategories.table';
import { isNotNull, isNull, sql } from 'drizzle-orm';
import {
    bigint,
    boolean,
    check,
    foreignKey,
    index,
    integer,
    jsonb,
    pgTable,
    primaryKey,
    text,
    unique,
    uniqueIndex,
    varchar,
} from 'drizzle-orm/pg-core';
import {
    type ProductOption,
    ProductStatus,
    ProductType,
} from './Product.types';

export const products = pgTable(
    'products',
    {
        id,
        projectId: text('project_id')
            .notNull()
            .references(() => projects.id, { onDelete: 'cascade' }),
        categoryId: text('category_id').references(() => projectCategories.id, {
            onDelete: 'set null',
        }),
        type: productTypeEnum('type').notNull().default(ProductType.PHYSICAL),
        name: varchar('name', { length: 255 }).notNull(),
        slug: varchar('slug', { length: 140 }).notNull(),
        sku: varchar('sku', { length: 64 }).notNull(),
        description: text('description'),
        price: bigint('price', { mode: 'number' }).notNull().default(0),
        currency: currencyEnum('currency').notNull().default('RUB'),
        status: productStatusEnum('status')
            .notNull()
            .default(ProductStatus.ACTIVE),
        images: textArray('images'),
        attributes: jsonb('attributes')
            .notNull()
            .default({})
            .$type<Record<string, unknown>>(),
        isFeatured: boolean('is_featured').notNull().default(false),

        options: jsonb('options')
            .notNull()
            .default([])
            .$type<ProductOption[]>(),

        stock: integer('stock'),
        deletedAt,
        createdAt,
    },
    (t) => [
        unique('products_id_project_unique').on(t.id, t.projectId),

        foreignKey({
            columns: [t.categoryId, t.projectId],
            foreignColumns: [projectCategories.id, projectCategories.projectId],
            name: 'products_category_project_fk',
        }),

        uniqueIndex('products_project_slug_unique')
            .on(t.projectId, t.slug)
            .where(isNull(t.deletedAt)),
        uniqueIndex('products_project_sku_unique')
            .on(t.projectId, t.sku)
            .where(isNull(t.deletedAt)),
        index('products_project_idx').on(t.projectId),
        index('products_category_idx').on(t.categoryId),
        index('products_status_idx').on(t.status),
        index('products_type_idx').on(t.type),
        index('products_deleted_idx').on(t.deletedAt),
        index('products_featured_idx').on(t.isFeatured),
        check('products_stock_non_negative', nullOrNonNegative(t.stock)),
        check(
            'products_stock_not_for_service',
            sql`${t.type} <> 'service' or ${t.stock} is null`,
        ),
    ],
);

export type ProductRecord = typeof products.$inferSelect;

export const productVariants = pgTable(
    'product_variants',
    {
        id,
        productId: text('product_id')
            .notNull()
            .references(() => products.id, { onDelete: 'cascade' }),
        projectId: text('project_id')
            .notNull()
            .references(() => projects.id, { onDelete: 'cascade' }),

        optionValues: jsonb('option_values')
            .notNull()
            .$type<Record<string, string>>(),

        sku: varchar('sku', { length: 64 }),
        price: bigint('price', { mode: 'number' }),
        stock: integer('stock'),
        isActive: boolean('is_active').notNull().default(true),
        position: integer('position').notNull().default(0),
        createdAt,
    },
    (t) => [
        foreignKey({
            columns: [t.productId, t.projectId],
            foreignColumns: [products.id, products.projectId],
            name: 'product_variants_product_project_fk',
        }).onDelete('cascade'),

        uniqueIndex('product_variants_combo_unique').on(
            t.productId,
            sql`(${t.optionValues}::text)`,
        ),
        uniqueIndex('product_variants_project_sku_unique')
            .on(t.projectId, t.sku)
            .where(isNotNull(t.sku)),
        index('product_variants_product_idx').on(t.productId),
        check(
            'product_variants_price_non_negative',
            nullOrNonNegative(t.price),
        ),
        check(
            'product_variants_stock_non_negative',
            nullOrNonNegative(t.stock),
        ),
    ],
);

export type ProductVariantRecord = typeof productVariants.$inferSelect;
export type NewProductVariantRecord = typeof productVariants.$inferInsert;

export const productBadges = pgTable(
    'product_badges',
    {
        productId: text('product_id').notNull(),
        badgeId: text('badge_id').notNull(),
        projectId: text('project_id').notNull(),
        position: integer('position').notNull().default(0),
    },
    (t) => [
        primaryKey({ columns: [t.productId, t.badgeId] }),
        foreignKey({
            columns: [t.productId, t.projectId],
            foreignColumns: [products.id, products.projectId],
            name: 'product_badges_product_project_fk',
        }).onDelete('cascade'),
        foreignKey({
            columns: [t.badgeId, t.projectId],
            foreignColumns: [projectBadges.id, projectBadges.projectId],
            name: 'product_badges_badge_project_fk',
        }).onDelete('cascade'),
        index('product_badges_badge_idx').on(t.badgeId),
    ],
);

export type ProductView = ProductRecord & {
    variants: ProductVariantRecord[];
    badges: string[];
    soldCount: number;
};
