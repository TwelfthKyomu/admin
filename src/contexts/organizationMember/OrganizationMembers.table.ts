import { id } from '@/infrastructure/database/columns';
import { organizationRoleEnum } from '@/infrastructure/database/schemas/enums';
import { organizations } from '@/contexts/organization/Organizations.table';
import { OrganizationRole } from '@/contexts/organizationMember/OrganizationMember.types';
import { users } from '@/contexts/user/Users.table';
import {
    index,
    pgTable,
    text,
    timestamp,
    unique,
    uniqueIndex,
} from 'drizzle-orm/pg-core';

export const organizationMembers = pgTable(
    'organization_members',
    {
        id,
        userId: text('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        organizationId: text('organization_id')
            .notNull()
            .references(() => organizations.id, { onDelete: 'cascade' }),
        role: organizationRoleEnum('role')
            .notNull()
            .default(OrganizationRole.MEMBER),
        joinedAt: timestamp('joined_at').notNull().defaultNow(),
        leftAt: timestamp('left_at'),
    },
    (t) => [
        unique('organization_members_id_org_unique').on(t.id, t.organizationId),
        uniqueIndex('uq_org_members_user_id').on(t.userId),
        index('idx_org_members_org_id').on(t.organizationId),
        index('idx_org_members_role').on(t.role),
        index('idx_org_members_org_left_joined').on(
            t.organizationId,
            t.leftAt,
            t.joinedAt,
        ),
        index('idx_org_members_org_role_left').on(
            t.organizationId,
            t.role,
            t.leftAt,
        ),
    ],
);

export type OrganizationMemberRecord = typeof organizationMembers.$inferSelect;
