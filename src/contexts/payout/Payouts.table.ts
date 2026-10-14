import { nonNegative } from '@/infrastructure/database/checks';
import { createdAt, id } from '@/infrastructure/database/columns';
import { organizations } from '@/contexts/organization/Organizations.table';
import { organizationMembers } from '@/contexts/organizationMember/OrganizationMembers.table';
import { projects } from '@/contexts/project/Projects.table';
import {
    bigint,
    check,
    foreignKey,
    index,
    integer,
    pgTable,
    text,
    timestamp,
    unique,
} from 'drizzle-orm/pg-core';

export const payouts = pgTable(
    'payouts',
    {
        id,
        employeeId: text('employee_id')
            .notNull()
            .references(() => organizationMembers.id, { onDelete: 'cascade' }),
        projectId: text('project_id')
            .notNull()
            .references(() => projects.id, { onDelete: 'cascade' }),
        organizationId: text('organization_id')
            .notNull()
            .references(() => organizations.id, { onDelete: 'cascade' }),
        periodStart: timestamp('period_start').notNull(),
        periodEnd: timestamp('period_end').notNull(),
        shiftsCount: integer('shifts_count').notNull().default(0),
        shiftRateAmount: bigint('shift_rate_amount', { mode: 'number' })
            .notNull()
            .default(0),
        shiftsPay: bigint('shifts_pay', { mode: 'number' })
            .notNull()
            .default(0),
        servicesRevenue: bigint('services_revenue', { mode: 'number' })
            .notNull()
            .default(0),
        commissionRate: integer('commission_rate').notNull().default(0),
        commissionPay: bigint('commission_pay', { mode: 'number' })
            .notNull()
            .default(0),
        deliveriesCount: integer('deliveries_count').notNull().default(0),
        deliveryRateAmount: bigint('delivery_rate_amount', { mode: 'number' })
            .notNull()
            .default(0),
        deliveriesPay: bigint('deliveries_pay', { mode: 'number' })
            .notNull()
            .default(0),
        totalAmount: bigint('total_amount', { mode: 'number' })
            .notNull()
            .default(0),
        createdAt,
    },
    (t) => [
        foreignKey({
            columns: [t.employeeId, t.organizationId],
            foreignColumns: [
                organizationMembers.id,
                organizationMembers.organizationId,
            ],
            name: 'payouts_employee_org_fk',
        }),
        foreignKey({
            columns: [t.projectId, t.organizationId],
            foreignColumns: [projects.id, projects.organizationId],
            name: 'payouts_project_org_fk',
        }),

        unique('payouts_employee_project_period_unique').on(
            t.employeeId,
            t.projectId,
            t.periodStart,
            t.periodEnd,
        ),
        index('payouts_project_period_idx').on(
            t.projectId,
            t.periodStart,
            t.periodEnd,
        ),
        check('payouts_total_non_negative', nonNegative(t.totalAmount)),
    ],
);

export type PayoutRecord = typeof payouts.$inferSelect;
export type NewPayoutRecord = typeof payouts.$inferInsert;
