'use client';

import { listQuery } from '@/shared/lib/queries';
import { useQuery } from '@tanstack/react-query';
import { auditLogAction } from './AuditLog.actions';

const auditLogQueries = {
    all: ['audit-log'] as const,
    list: (organizationId: string) =>
        listQuery(
            [...auditLogQueries.all, 'list', organizationId],
            () => auditLogAction({ organizationId }),
            { enabled: organizationId.length > 0 },
        ),
};

export function useAuditLogList(organizationId: string) {
    return useQuery(auditLogQueries.list(organizationId));
}
