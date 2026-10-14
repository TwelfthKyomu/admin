import {
    differenceInCalendarDays,
    eachDayOfInterval,
    isValid,
    parse,
} from 'date-fns';
import type { DayRow } from './weeklyTemplate';

export interface GeneratedShift {
    employeeId: string;
    startsAt: Date;
    endsAt: Date;
}

function shiftForDay(
    employeeId: string,
    day: Date,
    start: string,
    end: string,
): GeneratedShift[] {
    const startsAt = parse(start, 'HH:mm', day);
    const endsAt = parse(end, 'HH:mm', day);

    if (!isValid(startsAt) || !isValid(endsAt) || endsAt <= startsAt) return [];

    return [{ employeeId, startsAt, endsAt }];
}

export function buildShiftsForDays(
    employeeId: string,
    days: Date[],
    start: string,
    end: string,
): GeneratedShift[] {
    return days.flatMap((day) => shiftForDay(employeeId, day, start, end));
}

export function buildShiftsFromRows(
    employeeId: string,
    from: Date,
    to: Date,
    rows: Record<number, DayRow>,
): GeneratedShift[] {
    if (differenceInCalendarDays(to, from) < 0) return [];

    return eachDayOfInterval({ start: from, end: to }).flatMap((day) => {
        const row = rows[day.getDay()];

        return row?.enabled
            ? shiftForDay(employeeId, day, row.start, row.end)
            : [];
    });
}

export function createdShiftsMessage(
    data: { created: unknown[]; skipped: unknown[] } | undefined,
): string {
    const created = data?.created.length ?? 0;
    const skipped = data?.skipped.length ?? 0;

    return skipped > 0
        ? `Создано смен: ${created}, пропущено: ${skipped}`
        : `Создано смен: ${created}`;
}
