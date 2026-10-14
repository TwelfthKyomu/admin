import { nonNegative } from '@/infrastructure/database/checks';
import { createdAt, id } from '@/infrastructure/database/columns';
import {
    deliveryCarrierEnum,
    deliveryKindEnum,
    deliveryStatusEnum,
} from '@/infrastructure/database/schemas/enums';
import { orders } from '@/contexts/order/Orders.table';
import { organizations } from '@/contexts/organization/Organizations.table';
import { organizationMembers } from '@/contexts/organizationMember/OrganizationMembers.table';
import { projects } from '@/contexts/project/Projects.table';
import { sql } from 'drizzle-orm';
import {
    bigint,
    check,
    foreignKey,
    index,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
    varchar,
} from 'drizzle-orm/pg-core';

export const deliveries = pgTable(
    'deliveries',
    {
        id,
        projectId: text('project_id')
            .notNull()
            .references(() => projects.id, { onDelete: 'cascade' }),
        organizationId: text('organization_id')
            .notNull()
            .references(() => organizations.id, { onDelete: 'cascade' }),
        orderId: text('order_id')
            .notNull()
            .references(() => orders.id, { onDelete: 'cascade' }),
        kind: deliveryKindEnum('kind').notNull(),
        status: deliveryStatusEnum('status').notNull().default('queued'),
        courierId: text('courier_id').references(() => organizationMembers.id, {
            onDelete: 'set null',
        }),
        carrier: deliveryCarrierEnum('carrier'),
        trackingNumber: varchar('tracking_number', { length: 120 }),
        windowStart: timestamp('window_start'),
        windowEnd: timestamp('window_end'),
        address: varchar('address', { length: 500 }),
        recipientName: varchar('recipient_name', { length: 255 }),
        recipientPhone: varchar('recipient_phone', { length: 32 }),
        cashDue: bigint('cash_due', { mode: 'number' }).notNull().default(0),
        failureReason: varchar('failure_reason', { length: 255 }),
        assignedAt: timestamp('assigned_at'),
        pickedUpAt: timestamp('picked_up_at'),
        deliveredAt: timestamp('delivered_at'),
        failedAt: timestamp('failed_at'),
        cancelledAt: timestamp('cancelled_at'),
        createdAt,
    },
    (t) => [
        foreignKey({
            columns: [t.projectId, t.organizationId],
            foreignColumns: [projects.id, projects.organizationId],
            name: 'deliveries_project_org_fk',
        }),
        foreignKey({
            columns: [t.orderId, t.projectId],
            foreignColumns: [orders.id, orders.projectId],
            name: 'deliveries_order_project_fk',
        }),
        foreignKey({
            columns: [t.courierId, t.organizationId],
            foreignColumns: [
                organizationMembers.id,
                organizationMembers.organizationId,
            ],
            name: 'deliveries_courier_org_fk',
        }),
        uniqueIndex('deliveries_order_unique').on(t.orderId),
        index('deliveries_project_status_idx').on(t.projectId, t.status),
        index('deliveries_courier_window_idx').on(t.courierId, t.windowStart),
        check(
            'deliveries_kind_shape',
            sql`(${t.kind} = 'courier' and ${t.carrier} is null and ${t.trackingNumber} is null)
                or (${t.kind} = 'carrier' and ${t.courierId} is null and ${t.windowStart} is null and ${t.windowEnd} is null)`,
        ),
        check(
            'deliveries_window_order',
            sql`${t.windowStart} is null or ${t.windowEnd} is null or ${t.windowEnd} > ${t.windowStart}`,
        ),
        check('deliveries_cash_due_non_negative', nonNegative(t.cashDue)),
        check(
            'deliveries_courier_when_assigned',
            sql`${t.kind} <> 'courier' or ${t.status} not in ('assigned', 'picked_up', 'delivered') or ${t.courierId} is not null`,
        ),
    ],
);

export type DeliveryRecord = typeof deliveries.$inferSelect;
export type NewDeliveryRecord = typeof deliveries.$inferInsert;
