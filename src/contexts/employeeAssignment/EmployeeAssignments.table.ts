import { id } from '@/infrastructure/database/columns';
import { employeeKindEnum } from '@/infrastructure/database/schemas/enums';
import { organizations } from '@/contexts/organization/Organizations.table';
import { organizationMembers } from '@/contexts/organizationMember/OrganizationMembers.table';
import { projects } from '@/contexts/project/Projects.table';
import { isNull } from 'drizzle-orm';
import {
    bigint,
    boolean,
    foreignKey,
    index,
    integer,
    jsonb,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
    varchar,
} from 'drizzle-orm/pg-core';

export const employeeAssignments = pgTable(
    'employee_assignments',
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
        position: varchar('position', { length: 120 }).notNull(),
        kind: employeeKindEnum('kind').notNull().default('specialist'),
        isBookable: boolean('is_bookable').notNull().default(false),
        shiftRateAmount: bigint('shift_rate_amount', { mode: 'number' }),

        commissionRate: integer('commission_rate'),
        deliveryRateAmount: bigint('delivery_rate_amount', { mode: 'number' }),
        startedAt: timestamp('started_at').notNull().defaultNow(),
        endedAt: timestamp('ended_at'),
        metadata: jsonb('metadata')
            .$type<Record<string, unknown>>()
            .notNull()
            .default({}),
    },
    (t) => [
        foreignKey({
            columns: [t.employeeId, t.organizationId],
            foreignColumns: [
                organizationMembers.id,
                organizationMembers.organizationId,
            ],
            name: 'employee_assignments_employee_org_fk',
        }),
        foreignKey({
            columns: [t.projectId, t.organizationId],
            foreignColumns: [projects.id, projects.organizationId],
            name: 'employee_assignments_project_org_fk',
        }),

        uniqueIndex('employee_assignments_active_unique')
            .on(t.employeeId, t.projectId)
            .where(isNull(t.endedAt)),
        index('employee_assignments_project_idx').on(t.projectId),
        index('employee_assignments_employee_idx').on(t.employeeId),
    ],
);

export type EmployeeAssignmentRecord = typeof employeeAssignments.$inferSelect;
export type NewEmployeeAssignmentRecord =
    typeof employeeAssignments.$inferInsert;
