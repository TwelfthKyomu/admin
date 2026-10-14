import { createOptions } from '@/shared/lib/createOptions';
import type { BadgeVariant } from '@/shared/types';
import { EmployeeKind } from '@/contexts/employeeAssignment/EmployeeAssignment.types';
import {
    SHIFT_CANCEL_REASON_VALUES,
    ShiftCancelReason,
} from '@/contexts/employeeShift';
import {
    ORGANIZATION_ROLE_VALUES,
    OrganizationRole,
} from '@/contexts/organizationMember';
import { ProjectRole } from '@/contexts/project';
import { ProjectInviteStatus } from '@/contexts/projectInvite/ProjectInvite.types';

export const ORGANIZATION_ROLE_LABEL: Record<OrganizationRole, string> = {
    [OrganizationRole.OWNER]: 'Владелец',
    [OrganizationRole.ADMIN]: 'Администратор',
    [OrganizationRole.MEMBER]: 'Сотрудник',
};

export const ORGANIZATION_ROLE_VARIANT: Record<OrganizationRole, BadgeVariant> =
    {
        [OrganizationRole.OWNER]: 'default',
        [OrganizationRole.ADMIN]: 'default',
        [OrganizationRole.MEMBER]: 'secondary',
    };

export const PROJECT_ROLE_LABEL: Record<ProjectRole, string> = {
    [ProjectRole.MANAGER]: 'Управляющий',
    [ProjectRole.EDITOR]: 'Продавец',
    [ProjectRole.MASTER]: 'Мастер',
    [ProjectRole.COURIER]: 'Курьер',
    [ProjectRole.ACCOUNTANT]: 'Бухгалтер',
    [ProjectRole.VIEWER]: 'Наблюдатель',
};

export const EMPLOYEE_KIND_LABEL: Record<EmployeeKind, string> = {
    [EmployeeKind.SPECIALIST]: 'Мастер',
    [EmployeeKind.COURIER]: 'Курьер',
};

export const INVITE_STATUS_LABEL: Record<ProjectInviteStatus, string> = {
    [ProjectInviteStatus.PENDING]: 'активно',
    [ProjectInviteStatus.ACCEPTED]: 'принято',
    [ProjectInviteStatus.REVOKED]: 'отозвано',
    [ProjectInviteStatus.EXPIRED]: 'истекло',
};

export const PROJECT_ROLE_OPTIONS = createOptions(
    [
        ProjectRole.MANAGER,
        ProjectRole.EDITOR,
        ProjectRole.MASTER,
        ProjectRole.COURIER,
        ProjectRole.ACCOUNTANT,
        ProjectRole.VIEWER,
    ],
    PROJECT_ROLE_LABEL,
);

export const ASSIGNABLE_ORGANIZATION_ROLE_OPTIONS = createOptions(
    ORGANIZATION_ROLE_VALUES.filter((role) => role !== OrganizationRole.OWNER),
    ORGANIZATION_ROLE_LABEL,
);

export const SHIFT_CANCEL_REASON_LABEL: Record<ShiftCancelReason, string> = {
    [ShiftCancelReason.SICK]: 'Болезнь',
    [ShiftCancelReason.DAY_OFF]: 'Отгул',
    [ShiftCancelReason.VACATION]: 'Отпуск',
    [ShiftCancelReason.REPLACED]: 'Замена',
    [ShiftCancelReason.OTHER]: 'Другое',
};

export const SHIFT_CANCEL_REASON_OPTIONS = createOptions(
    SHIFT_CANCEL_REASON_VALUES.filter(
        (reason) => reason !== ShiftCancelReason.REPLACED,
    ),
    SHIFT_CANCEL_REASON_LABEL,
);
