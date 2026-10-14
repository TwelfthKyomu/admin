import { id } from '@/infrastructure/database/columns';
import { projects } from '@/contexts/project/Projects.table';
import { users } from '@/contexts/user/Users.table';
import {
    index,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
    varchar,
} from 'drizzle-orm/pg-core';

export const projectInvites = pgTable(
    'project_invites',
    {
        id,
        projectId: text('project_id')
            .notNull()
            .references(() => projects.id, { onDelete: 'cascade' }),
        email: varchar('email', { length: 255 }),
        token: varchar('token', { length: 64 })
            .notNull()
            .$defaultFn(() => crypto.randomUUID().replace(/-/g, '')),
        verificationCode: varchar('verification_code', { length: 6 }).notNull(),
        expiresAt: timestamp('expires_at').notNull(),
        acceptedAt: timestamp('accepted_at'),
        acceptedBy: text('accepted_by').references(() => users.id, {
            onDelete: 'set null',
        }),
        revokedAt: timestamp('revoked_at'),
        createdBy: text('created_by').references(() => users.id, {
            onDelete: 'set null',
        }),
        createdAt: timestamp('created_at').notNull().defaultNow(),
    },
    (t) => [
        uniqueIndex('project_invites_token_unique').on(t.token),
        index('project_invites_project_idx').on(t.projectId),
    ],
);

export type ProjectInviteRecord = typeof projectInvites.$inferSelect;
