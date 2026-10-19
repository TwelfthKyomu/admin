'use client';

import { fmtWeekdayDate } from '@/shared/format/date';
import { SHIFT_CANCEL_REASON_LABEL } from '@/shared/labels/team';
import { computeRange, type ScheduleColumn } from '@/ui/Base/Scheduler';
import { eachDayOfInterval, format, isSameDay, subDays } from 'date-fns';
import { ColumnHeader } from '../components/ColumnHeader';
import { useScheduleContext } from '../components/ScheduleProvider';
import { ShiftHeaderActions } from '../components/ShiftHeaderActions';
import {
    pickCancelledShift,
    pickShift,
    pickShiftWindow,
    pickTeamWindow,
    type ScheduleSale,
    shiftWindowLabel,
} from '../lib/mapToScheduler';

const COLUMN_MIN_WIDTH = 160;

const NO_SHIFT_WINDOW = [0, 0] as const;

export function useScheduleColumns(): ScheduleColumn<ScheduleSale>[] {
    const { date, mode, data, visibleEmployees, workingEmployees, projectId } =
        useScheduleContext();

    const today = new Date();

    if (mode === 'day') {
        const columns = visibleEmployees.map((employee): ScheduleColumn<ScheduleSale> => {
            const shift = pickShift(data.shifts, employee.employeeId, date);
            const shiftWindow = pickShiftWindow(data.shifts, employee.employeeId, date);

            const cancelled = shift
                ? undefined
                : pickCancelledShift(data.shifts, employee.employeeId, date);

            const noShiftLabel = cancelled
                ? `Смена отменена${cancelled.cancelReason ? ` · ${SHIFT_CANCEL_REASON_LABEL[cancelled.cancelReason]}` : ''}`
                : 'Нет смены';

            return {
                id: employee.employeeId,
                match: (sale) => sale.sellerId === employee.employeeId,
                minWidth: COLUMN_MIN_WIDTH,
                showNow: isSameDay(date, today),
                workingHours: shiftWindow ?? NO_SHIFT_WINDOW,
                header: (
                    <ColumnHeader
                        title={employee.name}
                        sub={shiftWindow ? shiftWindowLabel(shiftWindow) : noShiftLabel}
                        actions={
                            shift ? (
                                <ShiftHeaderActions
                                    projectId={projectId}
                                    shift={shift}
                                    employeeName={employee.name}
                                    workingEmployees={workingEmployees}
                                />
                            ) : undefined
                        }
                    />
                ),
            };
        });

        return columns;
    }

    const { from, to } = computeRange(date, mode);
    const days = eachDayOfInterval({ start: from, end: subDays(to, 1) });
    const employeeIds = visibleEmployees.map((employee) => employee.employeeId);

    const columns = days.map((day): ScheduleColumn<ScheduleSale> => {
        const key = format(day, 'yyyy-MM-dd');
        const isToday = isSameDay(day, today);
        const teamWindow = pickTeamWindow(data.shifts, employeeIds, day);
        const hoursLabel = teamWindow ? shiftWindowLabel(teamWindow) : 'Нет смен';

        return {
            id: key,
            date: day,
            match: (sale) => format(sale.start, 'yyyy-MM-dd') === key,
            minWidth: COLUMN_MIN_WIDTH,
            showNow: isToday,
            workingHours: teamWindow ?? NO_SHIFT_WINDOW,
            header: (
                <ColumnHeader
                    title={fmtWeekdayDate(day)}
                    sub={isToday ? `Сегодня · ${hoursLabel}` : hoursLabel}
                />
            ),
        };
    });

    return columns;
}
