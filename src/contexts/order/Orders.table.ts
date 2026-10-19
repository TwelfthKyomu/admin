import {
    nonNegative,
    nullOrPositive,
    positive,
} from '@/infrastructure/database/checks';
import { createdAt, id } from '@/infrastructure/database/columns';
import {
    currencyEnum,
    orderEventTypeEnum,
    orderSourceEnum,
    orderStatusEnum,
    orderTypeEnum,
    paymentStatusEnum,
    productTypeEnum,
} from '@/infrastructure/database/schemas/enums';
import { clients } from '@/contexts/client/Clients.table';
import { organizations } from '@/contexts/organization/Organizations.table';
import { organizationMembers } from '@/contexts/organizationMember/OrganizationMembers.table';
import { products, productVariants } from '@/contexts/product/Products.table';
import { projects } from '@/contexts/project/Projects.table';
import { users } from '@/contexts/user/Users.table';
import { isNotNull, sql } from 'drizzle-orm';
import {
    bigint,
    check,
    foreignKey,
    index,
    integer,
    jsonb,
    pgTable,
    text,
    timestamp,
    unique,
    varchar,
} from 'drizzle-orm/pg-core';

export const orders = pgTable(
    'orders',
    {
        id,
        projectId: text('project_id')
            .notNull()
            .references(() => projects.id, { onDelete: 'cascade' }),
        organizationId: text('organization_id')
            .notNull()
            .references(() => organizations.id, { onDelete: 'cascade' }),
        type: orderTypeEnum('type').notNull().default('sale'),
        status: orderStatusEnum('status').notNull().default('pending'),
        clientId: text('client_id').references(() => clients.id, {
            onDelete: 'set null',
        }),
        customerName: varchar('customer_name', { length: 255 }),
        customerPhone: varchar('customer_phone', { length: 32 }),
        customerEmail: varchar('customer_email', { length: 255 }),
        assignedEmployeeId: text('assigned_employee_id').references(
            () => organizationMembers.id,
            {
                onDelete: 'set null',
            },
        ),
        sellerId: text('seller_id').references(() => organizationMembers.id, {
            onDelete: 'set null',
        }),
        soldAt: timestamp('sold_at'),
        source: orderSourceEnum('source').notNull().default('store'),
        scheduledAt: timestamp('scheduled_at'),
        durationMinutes: integer('duration_minutes'),
        completedAt: timestamp('completed_at'),
        reminderSentAt: timestamp('reminder_sent_at'),
        currency: currencyEnum('currency').notNull().default('RUB'),
        subtotalAmount: bigint('subtotal_amount', { mode: 'number' })
            .notNull()
            .default(0),
        discountAmount: bigint('discount_amount', { mode: 'number' })
            .notNull()
            .default(0),
        totalAmount: bigint('total_amount', { mode: 'number' })
            .notNull()
            .default(0),
        paidAmount: bigint('paid_amount', { mode: 'number' })
            .notNull()
            .default(0),
        refundedAmount: bigint('refunded_amount', { mode: 'number' })
            .notNull()
            .default(0),
        paymentStatus: paymentStatusEnum('payment_status')
            .notNull()
            .default('unpaid'),

        notes: text('notes'),
        createdAt,
    },
    (t) => [
        check('orders_subtotal_non_negative', nonNegative(t.subtotalAmount)),
        check('orders_discount_non_negative', nonNegative(t.discountAmount)),
        check('orders_total_non_negative', nonNegative(t.totalAmount)),
        check('orders_paid_non_negative', nonNegative(t.paidAmount)),
        check('orders_refunded_non_negative', nonNegative(t.refundedAmount)),
        check('orders_duration_positive', nullOrPositive(t.durationMinutes)),
        check(
            'orders_scheduled_for_booking',
            sql`${t.type} = 'sale' or ${t.scheduledAt} is not null or ${t.status} = 'cancelled'`,
        ),

        unique('orders_id_project_unique').on(t.id, t.projectId),

        foreignKey({
            columns: [t.clientId, t.projectId],
            foreignColumns: [clients.id, clients.projectId],
            name: 'orders_client_project_fk',
        }),

        foreignKey({
            columns: [t.projectId, t.organizationId],
            foreignColumns: [projects.id, projects.organizationId],
            name: 'orders_project_org_fk',
        }),

        foreignKey({
            columns: [t.assignedEmployeeId, t.organizationId],
            foreignColumns: [
                organizationMembers.id,
                organizationMembers.organizationId,
            ],
            name: 'orders_employee_org_fk',
        }),

        foreignKey({
            columns: [t.sellerId, t.organizationId],
            foreignColumns: [
                organizationMembers.id,
                organizationMembers.organizationId,
            ],
            name: 'orders_seller_org_fk',
        }),

        index('orders_project_status_idx').on(t.projectId, t.status),
        index('orders_project_scheduled_idx').on(t.projectId, t.scheduledAt),
        index('orders_project_created_idx').on(t.projectId, t.createdAt),
        index('orders_employee_scheduled_idx').on(
            t.assignedEmployeeId,
            t.scheduledAt,
        ),
        index('orders_client_idx').on(t.clientId),
        index('orders_seller_sold_idx').on(t.sellerId, t.soldAt),
        index('orders_project_sold_idx').on(t.projectId, t.soldAt),
    ],
);

export type OrderRecord = typeof orders.$inferSelect;
export type NewOrderRecord = typeof orders.$inferInsert;

export type OrderView = OrderRecord;

export const orderItems = pgTable(
    'order_items',
    {
        id,
        orderId: text('order_id')
            .notNull()
            .references(() => orders.id, { onDelete: 'cascade' }),
        productId: text('product_id').references(() => products.id, {
            onDelete: 'set null',
        }),
        variantId: text('variant_id').references(() => productVariants.id, {
            onDelete: 'set null',
        }),
        performerEmployeeId: text('performer_employee_id').references(
            () => organizationMembers.id,
            { onDelete: 'set null' },
        ),
        name: varchar('name', { length: 255 }).notNull(),
        type: productTypeEnum('type').notNull(),
        unitPriceAmount: bigint('unit_price_amount', {
            mode: 'number',
        }).notNull(),
        quantity: integer('quantity').notNull().default(1),
        totalAmount: bigint('total_amount', { mode: 'number' }).notNull(),
        durationMinutes: integer('duration_minutes'),
        createdAt: timestamp('created_at').notNull().defaultNow(),
    },
    (t) => [
        check('order_items_quantity_positive', positive(t.quantity)),
        check(
            'order_items_unit_price_non_negative',
            nonNegative(t.unitPriceAmount),
        ),
        check('order_items_total_non_negative', nonNegative(t.totalAmount)),
        check(
            'order_items_duration_positive',
            nullOrPositive(t.durationMinutes),
        ),
        index('order_items_order_idx').on(t.orderId),
        index('order_items_product_idx').on(t.productId),
        index('order_items_variant_idx')
            .on(t.variantId)
            .where(isNotNull(t.variantId)),
        index('order_items_performer_idx').on(t.performerEmployeeId),
    ],
);

export type OrderItemRecord = typeof orderItems.$inferSelect;
export type NewOrderItemRecord = typeof orderItems.$inferInsert;

export type OrderItemView = OrderItemRecord;

export const orderEvents = pgTable(
    'order_events',
    {
        id,
        orderId: text('order_id')
            .notNull()
            .references(() => orders.id, { onDelete: 'cascade' }),
        type: orderEventTypeEnum('type').notNull(),
        byUserId: text('by_user_id').references(() => users.id, {
            onDelete: 'set null',
        }),
        payload: jsonb('payload')
            .$type<Record<string, unknown>>()
            .notNull()
            .default({}),
        createdAt: timestamp('created_at').notNull().defaultNow(),
    },
    (t) => [
        index('order_events_order_idx').on(t.orderId, t.createdAt),
        index('order_events_type_idx').on(t.type),
    ],
);

export type OrderEventRecord = typeof orderEvents.$inferSelect;
export type NewOrderEventRecord = typeof orderEvents.$inferInsert;

export type OrderEventView = OrderEventRecord;
