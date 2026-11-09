import { nonNegative } from '@/infrastructure/database/checks';
import { createdAt, deletedAt, id } from '@/infrastructure/database/columns';
import { products, productVariants } from '@/contexts/product/Products.table';
import { projects } from '@/contexts/project/Projects.table';
import { isNull, sql } from 'drizzle-orm';
import {
    boolean,
    check,
    foreignKey,
    index,
    integer,
    pgTable,
    text,
    unique,
    uniqueIndex,
    varchar,
} from 'drizzle-orm/pg-core';

export const warehouses = pgTable(
    'warehouses',
    {
        id,
        projectId: text('project_id')
            .notNull()
            .references(() => projects.id, { onDelete: 'cascade' }),
        name: varchar('name', { length: 100 }).notNull(),
        forSite: boolean('for_site').notNull().default(true),
        position: integer('position').notNull().default(0),
        deletedAt,
        createdAt,
    },
    (t) => [
        unique('warehouses_id_project_unique').on(t.id, t.projectId),
        index('warehouses_project_idx').on(t.projectId),
        uniqueIndex('warehouses_project_name_unique')
            .on(t.projectId, t.name)
            .where(isNull(t.deletedAt)),
    ],
);

export const warehouseStock = pgTable(
    'warehouse_stock',
    {
        id,
        projectId: text('project_id')
            .notNull()
            .references(() => projects.id, { onDelete: 'cascade' }),
        warehouseId: text('warehouse_id').notNull(),
        productId: text('product_id')
            .notNull()
            .references(() => products.id, { onDelete: 'cascade' }),
        variantId: text('variant_id').references(() => productVariants.id, {
            onDelete: 'cascade',
        }),
        quantity: integer('quantity').notNull().default(0),
    },
    (t) => [
        foreignKey({
            columns: [t.warehouseId, t.projectId],
            foreignColumns: [warehouses.id, warehouses.projectId],
            name: 'warehouse_stock_warehouse_project_fk',
        }).onDelete('cascade'),
        foreignKey({
            columns: [t.productId, t.projectId],
            foreignColumns: [products.id, products.projectId],
            name: 'warehouse_stock_product_project_fk',
        }).onDelete('cascade'),

        uniqueIndex('warehouse_stock_line_unique').on(
            t.warehouseId,
            t.productId,
            sql`coalesce(${t.variantId}, '')`,
        ),
        index('warehouse_stock_product_idx').on(t.productId, t.variantId),

        check('warehouse_stock_quantity_non_negative', nonNegative(t.quantity)),
    ],
);

export type WarehouseRecord = typeof warehouses.$inferSelect;

export type WarehouseView = WarehouseRecord;
