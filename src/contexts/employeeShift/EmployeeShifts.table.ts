import { nonNegative } from '@/infrastructure/database/checks';
import { createdAt, id } from '@/infrastructure/database/columns';
import {
    shiftCancelReasonEnum,
    shiftStatusEnum,
} from '@/infrastructure/database/schemas/enums';
import { organizations } from '@/contexts/organization/Organizations.table';
import { organizationMembers } from '@/contexts/organizationMember/OrganizationMembers.table';
import { projects } from '@/contexts/project/Projects.table';
import { gt } from 'drizzle-orm';
import {
    boolean,
    check,
    foreignKey,
    index,
    integer,
    pgTable,
    text,
    timestamp,
} from 'drizzle-orm/pg-core';

export const employeeShifts = pgTable(
    'employee_shifts',
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
        startsAt: timestamp('starts_at').notNull(),
        endsAt: timestamp('ends_at').notNull(),
        status: shiftStatusEnum('status').notNull().default('scheduled'),
        cancelReason: shiftCancelReasonEnum('cancel_reason'),
        breakMinutes: integer('break_minutes').notNull().default(0),
        notes: text('notes'),
        seekingReplacement: boolean('seeking_replacement')
            .notNull()
            .default(false),
        createdAt,
    },
    (t) => [
        foreignKey({
            columns: [t.employeeId, t.organizationId],
            foreignColumns: [
                organizationMembers.id,
                organizationMembers.organizationId,
            ],
            name: 'employee_shifts_employee_org_fk',
        }),
        foreignKey({
            columns: [t.projectId, t.organizationId],
            foreignColumns: [projects.id, projects.organizationId],
            name: 'employee_shifts_project_org_fk',
        }),
        check('shift_ends_after_starts', gt(t.endsAt, t.startsAt)),
        check('shift_break_non_negative', nonNegative(t.breakMinutes)),
        index('employee_shifts_employee_starts_idx').on(
            t.employeeId,
            t.startsAt,
        ),
        index('employee_shifts_project_starts_idx').on(t.projectId, t.startsAt),
        index('employee_shifts_status_idx').on(t.status),
    ],
);

export type EmployeeShiftRecord = typeof employeeShifts.$inferSelect;
export type NewEmployeeShiftRecord = typeof employeeShifts.$inferInsert;

export type EmployeeShiftView = EmployeeShiftRecord;
