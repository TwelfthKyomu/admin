import { nonNegative, positive } from '@/infrastructure/database/checks';
import { createdAt, id } from '@/infrastructure/database/columns';
import { organizationMembers } from '@/contexts/organizationMember/OrganizationMembers.table';
import { projects } from '@/contexts/project/Projects.table';
import { users } from '@/contexts/user/Users.table';
import { isNull, sql } from 'drizzle-orm';
import {
    bigint,
    check,
    foreignKey,
    index,
    pgTable,
    text,
    timestamp,
    unique,
    uniqueIndex,
} from 'drizzle-orm/pg-core';

export const cashShifts = pgTable(
    'cash_shifts',
    {
        id,
        projectId: text('project_id')
            .notNull()
            .references(() => projects.id, { onDelete: 'cascade' }),
        openingAmount: bigint('opening_amount', { mode: 'number' })
            .notNull()
            .default(0),
        closingCountedAmount: bigint('closing_counted_amount', {
            mode: 'number',
        }),
        closingNote: text('closing_note'),
        openedBy: text('opened_by').references(() => users.id, {
            onDelete: 'set null',
        }),
        closedBy: text('closed_by').references(() => users.id, {
            onDelete: 'set null',
        }),
        closedAt: timestamp('closed_at'),
        createdAt,
    },
    (t) => [
        unique('cash_shifts_id_project_unique').on(t.id, t.projectId),

        uniqueIndex('cash_shifts_one_open_per_project')
            .on(t.projectId)
            .where(isNull(t.closedAt)),
        index('cash_shifts_project_idx').on(t.projectId, t.createdAt),
        check('cash_shifts_opening_non_negative', nonNegative(t.openingAmount)),
        check(
            'cash_shifts_closed_shape',
            sql`(${t.closedAt} is null) = (${t.closingCountedAmount} is null)`,
        ),
    ],
);

export type CashShiftRecord = typeof cashShifts.$inferSelect;
export type NewCashShiftRecord = typeof cashShifts.$inferInsert;

export const cashCollections = pgTable(
    'cash_collections',
    {
        id,
        cashShiftId: text('cash_shift_id')
            .notNull()
            .references(() => cashShifts.id, { onDelete: 'cascade' }),
        amount: bigint('amount', { mode: 'number' }).notNull(),
        note: text('note'),
        createdBy: text('created_by').references(() => users.id, {
            onDelete: 'set null',
        }),
        occurredAt: timestamp('occurred_at').notNull().defaultNow(),
    },
    (t) => [
        index('cash_collections_shift_idx').on(t.cashShiftId),
        check('cash_collections_amount_positive', positive(t.amount)),
    ],
);

export type CashCollectionRecord = typeof cashCollections.$inferSelect;
export type NewCashCollectionRecord = typeof cashCollections.$inferInsert;

export const courierHandovers = pgTable(
    'courier_handovers',
    {
        id,
        cashShiftId: text('cash_shift_id')
            .notNull()
            .references(() => cashShifts.id, { onDelete: 'cascade' }),
        projectId: text('project_id')
            .notNull()
            .references(() => projects.id, { onDelete: 'cascade' }),
        employeeId: text('employee_id')
            .notNull()
            .references(() => organizationMembers.id, { onDelete: 'restrict' }),
        amount: bigint('amount', { mode: 'number' }).notNull(),
        createdBy: text('created_by').references(() => users.id, {
            onDelete: 'set null',
        }),
        occurredAt: timestamp('occurred_at').notNull().defaultNow(),
    },
    (t) => [
        foreignKey({
            columns: [t.cashShiftId, t.projectId],
            foreignColumns: [cashShifts.id, cashShifts.projectId],
            name: 'courier_handovers_shift_project_fk',
        }),
        index('courier_handovers_shift_idx').on(t.cashShiftId),
        index('courier_handovers_employee_idx').on(t.projectId, t.employeeId),
        check('courier_handovers_amount_positive', positive(t.amount)),
    ],
);

export type CourierHandoverRecord = typeof courierHandovers.$inferSelect;
