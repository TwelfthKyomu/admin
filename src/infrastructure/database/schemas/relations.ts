import { organizations } from '@/contexts/organization/Organizations.table';
import { organizationMembers } from '@/contexts/organizationMember/OrganizationMembers.table';
import { accounts, sessions, users } from '@/contexts/user/Users.table';
import { relations } from 'drizzle-orm';

export const usersRelations = relations(users, ({ many }) => ({
    accounts: many(accounts),
    sessions: many(sessions),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
    user: one(users, {
        fields: [accounts.userId],
        references: [users.id],
    }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
    user: one(users, {
        fields: [sessions.userId],
        references: [users.id],
    }),
}));

export const organizationsRelations = relations(
    organizations,
    ({ many, one }) => ({
        members: many(organizationMembers),
        creator: one(users, {
            fields: [organizations.createdBy],
            references: [users.id],
        }),
    }),
);

export const organizationMembersRelations = relations(
    organizationMembers,
    ({ one }) => ({
        organization: one(organizations, {
            fields: [organizationMembers.organizationId],
            references: [organizations.id],
        }),
        user: one(users, {
            relationName: 'organization_member_user',
            fields: [organizationMembers.userId],
            references: [users.id],
        }),
    }),
);
