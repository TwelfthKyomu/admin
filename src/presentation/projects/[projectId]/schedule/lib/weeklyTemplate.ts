import { WEEKDAYS_MON_FIRST } from '@/shared/constants';
import {
    SHIFT_DEFAULT_END_TIME,
    SHIFT_DEFAULT_START_TIME,
} from '@/contexts/employeeShift';
import * as z from 'zod/mini';

export interface DayRow {
    enabled: boolean;
    start: string;
    end: string;
}

export const OFF_DAY: DayRow = {
    enabled: false,
    start: SHIFT_DEFAULT_START_TIME,
    end: SHIFT_DEFAULT_END_TIME,
};

const WORKDAYS = new Set([1, 2, 3, 4, 5]);

const TimeSchema = z.string().check(z.regex(/^\d{2}:\d{2}$/));

const WeeklyHoursSchema = z.record(
    z.string(),
    z.object({ start: TimeSchema, end: TimeSchema }),
);

export function readDayRows(
    metadata?: Record<string, unknown>,
): Record<number, DayRow> {
    const saved = WeeklyHoursSchema.safeParse(metadata?.weeklyHours);

    const weekly =
        saved.success && Object.keys(saved.data).length > 0
            ? saved.data
            : undefined;

    const rows: Record<number, DayRow> = {};

    for (const { day } of WEEKDAYS_MON_FIRST) {
        const hours = weekly?.[day];

        rows[day] = hours
            ? { enabled: true, ...hours }
            : { ...OFF_DAY, enabled: !weekly && WORKDAYS.has(day) };
    }

    return rows;
}

export function writeDayRows(
    metadata: Record<string, unknown> | undefined,
    rows: Record<number, DayRow>,
): Record<string, unknown> {
    const weeklyHours: Record<number, { start: string; end: string }> = {};

    for (const { day } of WEEKDAYS_MON_FIRST) {
        const row = rows[day];

        if (row?.enabled) weeklyHours[day] = { start: row.start, end: row.end };
    }

    return { ...metadata, weeklyHours };
}
