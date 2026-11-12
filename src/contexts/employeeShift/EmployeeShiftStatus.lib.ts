import 'server-only';

import type { Tx } from '@/infrastructure/database/client';
import { ApplicationError } from '@/shared/api/errors';
import { updateOne } from '@/shared/api/repository';
import { addMinutes } from 'date-fns';
import { and, eq } from 'drizzle-orm';
import { assertShiftWindowFree } from './EmployeeShift.lib';
import {
    OPEN_SHIFT_STATUSES,
    SHIFT_EARLY_START_MINUTES,
    ShiftAction,
    type ShiftCancelReason,
    ShiftStatus,
} from './EmployeeShift.types';
import {
    type EmployeeShiftRecord,
    employeeShifts,
    type NewEmployeeShiftRecord,
} from './EmployeeShifts.table';

const planShiftStart = async (
    shift: EmployeeShiftRecord,
    at: Date,
): Promise<Partial<NewEmployeeShiftRecord>> => {
    if (shift.status !== ShiftStatus.SCHEDULED) {
        throw new ApplicationError('Начать можно только запланированную смену');
    }
    if (at < addMinutes(shift.startsAt, -SHIFT_EARLY_START_MINUTES)) {
        throw new ApplicationError(
            `Начать смену можно не раньше чем за ${SHIFT_EARLY_START_MINUTES} мин до её начала`,
        );
    }
    if (at >= shift.endsAt) {
        throw new ApplicationError(
            'Смена уже закончилась — отметьте её завершённой',
        );
    }

    if (at < shift.startsAt) {
        await assertShiftWindowFree(shift, {
            startsAt: at,
            endsAt: shift.endsAt,
        });

        return { status: ShiftStatus.IN_PROGRESS, startsAt: at };
    }

    return { status: ShiftStatus.IN_PROGRESS };
};

const planShiftComplete = async (
    shift: EmployeeShiftRecord,
    at: Date,
    fullAccess: boolean,
): Promise<Partial<NewEmployeeShiftRecord>> => {
    const completable =
        shift.status === ShiftStatus.IN_PROGRESS ||
        (fullAccess && shift.status === ShiftStatus.SCHEDULED);

    if (!completable) {
        throw new ApplicationError(
            fullAccess
                ? 'Завершить можно только идущую или запланированную смену'
                : 'Сначала начните смену',
        );
    }
    if (at <= shift.startsAt) {
        throw new ApplicationError('Нельзя завершить смену до её начала');
    }

    if (at > shift.endsAt) {
        await assertShiftWindowFree(shift, {
            startsAt: shift.startsAt,
            endsAt: at,
        });

        return { status: ShiftStatus.COMPLETED, endsAt: at };
    }

    return { status: ShiftStatus.COMPLETED };
};

const planShiftCancel = async (
    shift: EmployeeShiftRecord,
    cancelReason?: ShiftCancelReason,
): Promise<Partial<NewEmployeeShiftRecord>> => {
    if (!OPEN_SHIFT_STATUSES.includes(shift.status)) {
        throw new ApplicationError(
            'Отменить можно только запланированную или идущую смену',
        );
    }

    return {
        status: ShiftStatus.CANCELLED,
        cancelReason: cancelReason ?? null,
        seekingReplacement: false,
    };
};

const planShiftNoShow = async (
    shift: EmployeeShiftRecord,
    at: Date,
    fullAccess: boolean,
): Promise<Partial<NewEmployeeShiftRecord>> => {
    if (!fullAccess) {
        throw new ApplicationError(
            'Отметить неявку может только администратор расписания',
        );
    }
    if (shift.status !== ShiftStatus.SCHEDULED) {
        throw new ApplicationError(
            'Отметить неявку можно только для запланированной смены',
        );
    }
    if (at < shift.startsAt) {
        throw new ApplicationError(
            'Неявку можно отметить только после начала смены',
        );
    }

    return { status: ShiftStatus.NO_SHOW, seekingReplacement: false };
};

export const planShiftStatusChange = (
    shift: EmployeeShiftRecord,
    change: {
        action: ShiftAction;
        at: Date;
        fullAccess: boolean;
        cancelReason?: ShiftCancelReason;
    },
): Promise<Partial<NewEmployeeShiftRecord>> => {
    switch (change.action) {
        case ShiftAction.START:
            return planShiftStart(shift, change.at);
        case ShiftAction.COMPLETE:
            return planShiftComplete(shift, change.at, change.fullAccess);
        case ShiftAction.CANCEL:
            return planShiftCancel(shift, change.cancelReason);
        case ShiftAction.NO_SHOW:
            return planShiftNoShow(shift, change.at, change.fullAccess);
    }
};

export const updateShiftStatus = (
    shift: EmployeeShiftRecord,
    patch: Partial<NewEmployeeShiftRecord>,
    executor?: Tx,
): Promise<EmployeeShiftRecord> => {
    return updateOne(
        employeeShifts,
        and(
            eq(employeeShifts.id, shift.id),
            eq(employeeShifts.status, shift.status),
        ),
        patch,
        'Смена изменилась в другом окне — обновите страницу',
        executor,
    );
};
