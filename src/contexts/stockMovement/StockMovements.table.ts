import { positive } from '@/infrastructure/database/checks';
import { createdAt, id } from '@/infrastructure/database/columns';
import { stockMovementReasonEnum } from '@/infrastructure/database/schemas/enums';
import { orders } from '@/contexts/order/Orders.table';
import { products, productVariants } from '@/contexts/product/Products.table';
import { projects } from '@/contexts/project/Projects.table';
import { users } from '@/contexts/user/Users.table';
import { isNotNull, sql } from 'drizzle-orm';
import {
    check,
    foreignKey,
    index,
    integer,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
} from 'drizzle-orm/pg-core';

export const stockMovements = pgTable(
    'stock_movements',
    {
        id,
        projectId: text('project_id')
            .notNull()
            .references(() => projects.id, { onDelete: 'cascade' }),
        productId: text('product_id')
            .notNull()
            .references(() => products.id, { onDelete: 'cascade' }),
        variantId: text('variant_id').references(() => productVariants.id, {
            onDelete: 'set null',
        }),
        quantityDelta: integer('quantity_delta').notNull(),
        reason: stockMovementReasonEnum('reason').notNull(),
        orderId: text('order_id').references(() => orders.id, {
            onDelete: 'set null',
        }),
        note: text('note'),
        createdBy: text('created_by').references(() => users.id, {
            onDelete: 'set null',
        }),
        occurredAt: timestamp('occurred_at').notNull().defaultNow(),
    },
    (t) => [
        foreignKey({
            columns: [t.productId, t.projectId],
            foreignColumns: [products.id, products.projectId],
            name: 'stock_movements_product_project_fk',
        }),
        foreignKey({
            columns: [t.orderId, t.projectId],
            foreignColumns: [orders.id, orders.projectId],
            name: 'stock_movements_order_project_fk',
        }),

        index('stock_movements_project_idx').on(t.projectId),
        index('stock_movements_product_idx').on(t.productId, t.occurredAt),

        uniqueIndex('stock_movements_order_line_reason_unique')
            .on(
                t.orderId,
                t.productId,
                sql`coalesce(${t.variantId}, '')`,
                t.reason,
            )
            .where(isNotNull(t.orderId)),

        check(
            'stock_movements_quantity_delta_non_zero',
            sql`${t.quantityDelta} <> 0`,
        ),
    ],
);

export const stockReservations = pgTable(
    'stock_reservations',
    {
        id,
        projectId: text('project_id')
            .notNull()
            .references(() => projects.id, { onDelete: 'cascade' }),
        orderId: text('order_id')
            .notNull()
            .references(() => orders.id, { onDelete: 'cascade' }),
        productId: text('product_id')
            .notNull()
            .references(() => products.id, { onDelete: 'cascade' }),
        variantId: text('variant_id').references(() => productVariants.id, {
            onDelete: 'cascade',
        }),
        quantity: integer('quantity').notNull(),
        expiresAt: timestamp('expires_at'),
        createdAt,
    },
    (t) => [
        foreignKey({
            columns: [t.orderId, t.projectId],
            foreignColumns: [orders.id, orders.projectId],
            name: 'stock_reservations_order_project_fk',
        }),

        index('stock_reservations_product_idx').on(t.productId, t.variantId),

        uniqueIndex('stock_reservations_order_line_unique').on(
            t.orderId,
            t.productId,
            sql`coalesce(${t.variantId}, '')`,
        ),

        check('stock_reservations_quantity_positive', positive(t.quantity)),
    ],
);

export type StockMovementRecord = typeof stockMovements.$inferSelect;
export type NewStockMovementRecord = typeof stockMovements.$inferInsert;
export type NewStockReservationRecord = typeof stockReservations.$inferInsert;

export type StockMovementView = StockMovementRecord;
