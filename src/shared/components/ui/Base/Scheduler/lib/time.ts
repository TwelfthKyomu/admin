import { fmtDateRu, fmtDateShort } from '@/shared/format/date';
import { addDays, startOfDay, startOfWeek, subDays } from 'date-fns';
import { MODE_DAYS, MODE_LABELS, STEP_MIN } from '../constants';
import type { SchedulerMode } from '../Scheduler.types';

export function snap(minutes: number): number {
    return Math.round(minutes / STEP_MIN) * STEP_MIN;
}

export function computeRange(
    date: Date,
    mode: SchedulerMode,
): { from: Date; to: Date } {
    const from =
        mode === 'week'
            ? startOfWeek(date, { weekStartsOn: 1 })
            : startOfDay(date);

    return { from, to: addDays(from, MODE_DAYS[mode]) };
}

export function buildRangeLabel(
    date: Date,
    mode: SchedulerMode,
): { title: string; sub: string } {
    if (mode === 'day') return { title: fmtDateRu(date), sub: MODE_LABELS.day };

    const { from, to } = computeRange(date, mode);
    const end = subDays(to, 1);

    return {
        title: `${fmtDateShort(from)} – ${fmtDateShort(end)} ${end.getFullYear()}`,
        sub: MODE_LABELS[mode],
    };
}

export function shiftDate(date: Date, mode: SchedulerMode, dir: -1 | 1): Date {
    const next = addDays(date, MODE_DAYS[mode] * dir);

    return mode === 'week' ? startOfWeek(next, { weekStartsOn: 1 }) : next;
}
