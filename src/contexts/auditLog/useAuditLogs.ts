'use client';

import { defineResource } from '@/shared/lib/resource';
import { auditLogAction } from './AuditLog.actions';

const auditLog = defineResource({
    key: ['audit-log'],
    list: {
        action: auditLogAction,
        input: (organizationId: string) => ({ organizationId }),
        enabled: (organizationId) => organizationId.length > 0,
    },
});

export const { useList: useAuditLogList } = auditLog;
