import { positive } from '@/infrastructure/database/checks';
import { id } from '@/infrastructure/database/columns';
import {
    paymentDirectionEnum,
    paymentMethodEnum,
} from '@/infrastructure/database/schemas/enums';
import { cashShifts } from '@/contexts/cashShift/CashShifts.table';
import { orders } from '@/contexts/order/Orders.table';
import { organizationMembers } from '@/contexts/organizationMember/OrganizationMembers.table';
import { paymentIntents } from '@/contexts/paymentIntent/PaymentIntents.table';
import { projects } from '@/contexts/project/Projects.table';
import { users } from '@/contexts/user/Users.table';
import { isNotNull, sql } from 'drizzle-orm';
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

export const payments = pgTable(
    'payments',
    {
        id,
        projectId: text('project_id')
            .notNull()

            .references(() => projects.id, { onDelete: 'restrict' }),
        orderId: text('order_id').notNull(),
        direction: paymentDirectionEnum('direction').notNull(),
        amount: bigint('amount', { mode: 'number' }).notNull(),
        method: paymentMethodEnum('method'),
        sourceIntentId: text('source_intent_id').references(
            () => paymentIntents.id,
            { onDelete: 'set null' },
        ),
        reason: varchar('reason', { length: 255 }),
        recordedBy: text('recorded_by').references(() => users.id, {
            onDelete: 'set null',
        }),
        collectedByEmployeeId: text('collected_by_employee_id').references(
            () => organizationMembers.id,
            { onDelete: 'set null' },
        ),
        cashShiftId: text('cash_shift_id'),
        occurredAt: timestamp('occurred_at').notNull().defaultNow(),
        createdAt: timestamp('created_at').notNull().defaultNow(),
    },
    (t) => [
        foreignKey({
            columns: [t.orderId, t.projectId],
            foreignColumns: [orders.id, orders.projectId],
            name: 'payments_order_project_fk',
        }),
        foreignKey({
            columns: [t.cashShiftId, t.projectId],
            foreignColumns: [cashShifts.id, cashShifts.projectId],
            name: 'payments_cash_shift_project_fk',
        }),
        index('payments_cash_shift_idx')
            .on(t.cashShiftId)
            .where(isNotNull(t.cashShiftId)),
        check(
            'payments_cash_shift_only_register_cash',
            sql`${t.cashShiftId} is null or (${t.method} = 'cash' and ${t.collectedByEmployeeId} is null)`,
        ),
        index('payments_order_idx').on(t.orderId),
        index('payments_project_created_idx').on(t.projectId, t.createdAt),
        index('payments_collected_by_idx')
            .on(t.collectedByEmployeeId)
            .where(isNotNull(t.collectedByEmployeeId)),

        uniqueIndex('payments_source_intent_charge_unique')
            .on(t.sourceIntentId)
            .where(
                sql`${t.sourceIntentId} is not null and ${t.direction} = 'charge'`,
            ),

        check('payments_amount_positive', positive(t.amount)),
    ],
);

export type PaymentRecord = typeof payments.$inferSelect;
export type NewPaymentRecord = typeof payments.$inferInsert;
