import { id } from '@/infrastructure/database/columns';
import { organizations } from '@/contexts/organization/Organizations.table';
import { projects } from '@/contexts/project/Projects.table';
import { users } from '@/contexts/user/Users.table';
import { index, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import type { AuditMetadata } from './AuditLog.types';

export const auditLogs = pgTable(
    'audit_logs',
    {
        id,
        organizationId: text('organization_id')
            .notNull()
            .references(() => organizations.id, { onDelete: 'restrict' }),
        projectId: text('project_id').references(() => projects.id, {
            onDelete: 'set null',
        }),
        actorUserId: text('actor_user_id').references(() => users.id, {
            onDelete: 'set null',
        }),
        action: text('action').notNull(),
        targetType: text('target_type').notNull(),
        targetId: text('target_id'),
        summary: text('summary').notNull(),
        metadata: jsonb('metadata').$type<AuditMetadata>(),
        createdAt: timestamp('created_at').notNull().defaultNow(),
    },
    (t) => [
        index('idx_audit_logs_org_created').on(t.organizationId, t.createdAt),
        index('idx_audit_logs_action').on(t.action),
    ],
);

export type AuditLogRecord = typeof auditLogs.$inferSelect;
