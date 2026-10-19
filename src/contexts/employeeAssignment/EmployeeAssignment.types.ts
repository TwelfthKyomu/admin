import { enumValues } from '@/shared/lib/enum';
import type { ShiftStatus } from '@/contexts/employeeShift/EmployeeShift.types';
import { ProjectRole } from '@/contexts/project/Project.types';

export const EmployeeKind = {
    SPECIALIST: 'specialist',
    COURIER: 'courier',
} as const;

export type EmployeeKind = (typeof EmployeeKind)[keyof typeof EmployeeKind];

export const UNBOOKABLE_PROJECT_ROLES: ReadonlySet<ProjectRole> = new Set([
    ProjectRole.VIEWER,
    ProjectRole.COURIER,
    ProjectRole.ACCOUNTANT,
]);

export const EMPLOYEE_KIND_VALUES = enumValues(EmployeeKind);

const SHIFTLESS_PROJECT_ROLES: ReadonlySet<ProjectRole> = new Set([
    ProjectRole.VIEWER,
    ProjectRole.ACCOUNTANT,
]);

export function worksShifts(role: ProjectRole | null | undefined): boolean {
    return !role || !SHIFTLESS_PROJECT_ROLES.has(role);
}

export interface ProjectEmployeeRatesView {
    shiftRateAmount: number | null;
    commissionRate: number | null;
    siteCommissionRate: number | null;
    deliveryRateAmount: number | null;
}

export interface ProjectEmployeeTodayView {
    shiftId: string;
    status: ShiftStatus;
    startsAt: Date;
    endsAt: Date;
}

export interface ProjectEmployeeView {
    assignmentId: string;
    employeeId: string;
    userId: string;
    name: string;
    email: string;
    image: string | null;
    position: string;
    kind: EmployeeKind;
    isBookable: boolean;
    endedAt: Date | null;
    metadata: Record<string, unknown>;
    projectRole: ProjectRole | null;
    rates: ProjectEmployeeRatesView | null;
    today: ProjectEmployeeTodayView | null;
    seekingShifts: number;
}
