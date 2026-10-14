import { enumValues } from '@/shared/lib/enum';
import type { AuditLogRecord } from './AuditLogs.table';

export const AuditAction = {
    MemberRoleChanged: 'member.role_changed',
    BillingPlanChanged: 'billing.plan_changed',
    ApiKeyIssued: 'integration.api_key_issued',
    ApiKeyRevoked: 'integration.api_key_revoked',
    ProjectCreated: 'project.created',
    ProjectDeleted: 'project.deleted',
    InviteCreated: 'invite.created',
    ProjectMemberAttached: 'project_member.attached',
    ProjectMemberDetached: 'project_member.detached',
    MemberOffboarded: 'member.offboarded',
    PayoutRecorded: 'payout.recorded',
    PayoutDeleted: 'payout.deleted',
} as const;

export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];

const AUDIT_ACTION_VALUES = enumValues(AuditAction);

export const AUDIT_ACTION_LABEL: Record<AuditAction, string> = {
    [AuditAction.MemberRoleChanged]: 'Изменена роль участника',
    [AuditAction.BillingPlanChanged]: 'Изменён тариф',
    [AuditAction.ApiKeyIssued]: 'Выпущен API-ключ',
    [AuditAction.ApiKeyRevoked]: 'Отозван API-ключ',
    [AuditAction.ProjectCreated]: 'Создан проект',
    [AuditAction.ProjectDeleted]: 'Удалён проект',
    [AuditAction.InviteCreated]: 'Создано приглашение',
    [AuditAction.ProjectMemberAttached]: 'Участник привязан к проекту',
    [AuditAction.ProjectMemberDetached]: 'Участник отвязан от проекта',
    [AuditAction.MemberOffboarded]: 'Участник уволен из организации',
    [AuditAction.PayoutRecorded]: 'Зафиксирована выплата',
    [AuditAction.PayoutDeleted]: 'Отменена выплата',
};

export function isAuditAction(value: string): value is AuditAction {
    return AUDIT_ACTION_VALUES.some((action) => action === value);
}

export const AuditTargetType = {
    OrganizationMember: 'organization_member',
    Subscription: 'subscription',
    Integration: 'integration',
    Project: 'project',
    ProjectInvite: 'project_invite',
    ProjectMember: 'project_member',
    Payout: 'payout',
} as const;

export type AuditTargetType =
    (typeof AuditTargetType)[keyof typeof AuditTargetType];

const AUDIT_TARGET_TYPE_VALUES = enumValues(AuditTargetType);

export function isAuditTargetType(value: string): value is AuditTargetType {
    return AUDIT_TARGET_TYPE_VALUES.some((type) => type === value);
}

export type AuditMetadata = Record<string, string | number | boolean | null>;

export interface RecordAuditLogInput {
    organizationId: string;
    projectId?: string | null;
    actorUserId: string | null;
    action: AuditAction;
    targetType: AuditTargetType;
    targetId?: string | null;
    summary: string;
    metadata?: AuditMetadata | null;
}

export type AuditLogView = Omit<AuditLogRecord, 'action' | 'targetType'> & {
    action: AuditAction;
    targetType: AuditTargetType;
    actorName: string | null;
};
