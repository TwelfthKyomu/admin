import { enumValues } from '@/shared/lib/enum';
import type { EmployeeKind } from '@/contexts/employeeAssignment/EmployeeAssignment.types';
import type { ReassignShiftActionInputSchema } from '@/contexts/employeeShift/EmployeeShift.schema';
import { differenceInMinutes } from 'date-fns';
import type { z } from 'zod';
import type { EmployeeShiftRecord } from './EmployeeShifts.table';

export const ShiftStatus = {
    SCHEDULED: 'scheduled',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    NO_SHOW: 'no_show',
} as const;

export type ShiftStatus = (typeof ShiftStatus)[keyof typeof ShiftStatus];

export const SHIFT_STATUS_VALUES = enumValues(ShiftStatus);

export const WORKING_SHIFT_STATUSES: readonly ShiftStatus[] = [
    ShiftStatus.SCHEDULED,
    ShiftStatus.IN_PROGRESS,
    ShiftStatus.COMPLETED,
];

export type MyShiftView = Pick<
    EmployeeShiftRecord,
    'id' | 'projectId' | 'startsAt' | 'endsAt' | 'status'
>;

export const OPEN_SHIFT_STATUSES: readonly ShiftStatus[] = [
    ShiftStatus.SCHEDULED,
    ShiftStatus.IN_PROGRESS,
];

export type EmployeeWindow = Pick<
    EmployeeShiftRecord,
    'employeeId' | 'projectId' | 'startsAt' | 'endsAt'
>;

export function overlaps(
    a: Pick<EmployeeShiftRecord, 'startsAt' | 'endsAt'>,
    b: Pick<EmployeeShiftRecord, 'startsAt' | 'endsAt'>,
): boolean {
    return a.startsAt < b.endsAt && a.endsAt > b.startsAt;
}

export const ShiftCancelReason = {
    SICK: 'sick',
    DAY_OFF: 'day_off',
    VACATION: 'vacation',
    REPLACED: 'replaced',
    OTHER: 'other',
} as const;

export type ShiftCancelReason =
    (typeof ShiftCancelReason)[keyof typeof ShiftCancelReason];

export const SHIFT_CANCEL_REASON_VALUES = enumValues(ShiftCancelReason);

export const ShiftAction = {
    START: 'start',
    COMPLETE: 'complete',
    CANCEL: 'cancel',
    NO_SHOW: 'no_show',
} as const;

export type ShiftAction = (typeof ShiftAction)[keyof typeof ShiftAction];

export const SHIFT_ACTION_VALUES = enumValues(ShiftAction);

export const SHIFT_EARLY_START_MINUTES = 60;

export const SHIFT_DEFAULT_START_TIME = '09:00';
export const SHIFT_DEFAULT_END_TIME = '18:00';

export type ReplacementShiftView = EmployeeShiftRecord & {
    employeeName: string;
    kind: EmployeeKind;
    deliveriesCount: number;
    cashDue: number;
};

export type ReassignShiftFormValues = z.input<
    typeof ReassignShiftActionInputSchema
>;

export interface SkippedShiftView
    extends Pick<EmployeeShiftRecord, 'employeeId' | 'startsAt' | 'endsAt'> {
    reason: string;
}

export function skippedShift(
    shift: Pick<EmployeeShiftRecord, 'employeeId' | 'startsAt' | 'endsAt'>,
    reason: string,
): SkippedShiftView {
    return {
        employeeId: shift.employeeId,
        startsAt: shift.startsAt,
        endsAt: shift.endsAt,
        reason,
    };
}

export function shiftWindowError(
    shift: Pick<EmployeeShiftRecord, 'startsAt' | 'endsAt' | 'breakMinutes'>,
): string | null {
    if (shift.endsAt <= shift.startsAt) {
        return 'Смена должна заканчиваться позже своего начала';
    }
    if (
        shift.breakMinutes > differenceInMinutes(shift.endsAt, shift.startsAt)
    ) {
        return 'Перерыв не может превышать длительность смены';
    }

    return null;
}
