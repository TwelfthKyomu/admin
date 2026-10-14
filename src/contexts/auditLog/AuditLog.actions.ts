'use server';

import { organizationReadAction } from '@/shared/api/action-client';
import { Permission } from '@/contexts/user/User.types';
import { listAuditLogByOrganization } from './AuditLog.lib';
import { AuditLogActionInputSchema } from './AuditLog.schema';

export const auditLogAction = organizationReadAction(
    Permission.MANAGE_ORGANIZATION,
)
    .inputSchema(AuditLogActionInputSchema)
    .action(({ ctx: { organizationId } }) =>
        listAuditLogByOrganization(organizationId),
    );
