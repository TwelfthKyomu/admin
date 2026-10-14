import { createdAt, id } from '@/infrastructure/database/columns';
import { subscriptionPlanEnum } from '@/infrastructure/database/schemas/enums';
import type { OrganizationRole } from '@/contexts/organizationMember/OrganizationMember.types';
import { SubscriptionPlan } from '@/contexts/subscription/Subscription.types';
import { users } from '@/contexts/user/Users.table';
import {
    pgTable,
    text,
    timestamp,
    uniqueIndex,
    varchar,
} from 'drizzle-orm/pg-core';

export const organizations = pgTable(
    'organizations',
    {
        id,
        name: varchar('name', { length: 255 }).notNull(),
        plan: subscriptionPlanEnum('plan')
            .notNull()
            .default(SubscriptionPlan.FREE),
        planExpiresAt: timestamp('plan_expires_at'),
        createdBy: text('created_by')
            .notNull()
            .references(() => users.id),
        createdAt,
    },
    (t) => [uniqueIndex('uq_organizations_created_by').on(t.createdBy)],
);

export type OrganizationRecord = typeof organizations.$inferSelect;

export type UserOrganizationView = OrganizationRecord & {
    role: OrganizationRole;
};
