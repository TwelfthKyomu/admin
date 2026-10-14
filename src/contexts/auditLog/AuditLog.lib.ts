import 'server-only';

import { db } from '@/infrastructure/database/client';
import { PAGE_SIZE_LARGE, PAGE_SIZE_LIMIT } from '@/shared/constants/default';
import { getErrorMessage } from '@/shared/lib/errors';
import { users } from '@/contexts/user/Users.table';
import { desc, eq } from 'drizzle-orm';
import {
    type AuditLogView,
    isAuditAction,
    isAuditTargetType,
    type RecordAuditLogInput,
} from './AuditLog.types';
import { auditLogs } from './AuditLogs.table';

export async function recordAudit(input: RecordAuditLogInput): Promise<void> {
    try {
        await db.insert(auditLogs).values({
            organizationId: input.organizationId,
            projectId: input.projectId ?? null,
            actorUserId: input.actorUserId,
            action: input.action,
            targetType: input.targetType,
            targetId: input.targetId ?? null,
            summary: input.summary,
            metadata: input.metadata ?? null,
        });
    } catch (error) {
        console.error('Audit log write failed:', getErrorMessage(error));
    }
}

export async function listAuditLogByOrganization(
    organizationId: string,
    options?: { limit?: number },
): Promise<AuditLogView[]> {
    const limit = Math.min(options?.limit ?? PAGE_SIZE_LARGE, PAGE_SIZE_LIMIT);

    const rows = await db
        .select({ entry: auditLogs, actorName: users.name })
        .from(auditLogs)
        .leftJoin(users, eq(users.id, auditLogs.actorUserId))
        .where(eq(auditLogs.organizationId, organizationId))
        .orderBy(desc(auditLogs.createdAt))
        .limit(limit);

    return rows.flatMap(({ entry, actorName }) => {
        if (!isAuditAction(entry.action)) return [];
        if (!isAuditTargetType(entry.targetType)) return [];

        return [
            {
                ...entry,
                action: entry.action,
                targetType: entry.targetType,
                actorName,
                metadata: entry.metadata ?? null,
            },
        ];
    });
}
