import { fmtDateRu, fmtDateShort } from '@/shared/format/date';
import { addDays, startOfDay, startOfWeek, subDays } from 'date-fns';
import { MODE_DAYS, MODE_LABELS, STEP_MIN } from '../constants';
import type { SchedulerMode } from '../Scheduler.types';

export const snap = (minutes: number): number => {
    return Math.round(minutes / STEP_MIN) * STEP_MIN;
};

export const computeRange = (
    date: Date,
    mode: SchedulerMode,
): { from: Date; to: Date } => {
    const from =
        mode === 'week'
            ? startOfWeek(date, { weekStartsOn: 1 })
            : startOfDay(date);

    return { from, to: addDays(from, MODE_DAYS[mode]) };
};

export const buildRangeLabel = (
    date: Date,
    mode: SchedulerMode,
): { title: string; sub: string } => {
    if (mode === 'day') return { title: fmtDateRu(date), sub: MODE_LABELS.day };

    const { from, to } = computeRange(date, mode);
    const end = subDays(to, 1);

    return {
        title: `${fmtDateShort(from)} – ${fmtDateShort(end)} ${end.getFullYear()}`,
        sub: MODE_LABELS[mode],
    };
};

export const shiftDate = (
    date: Date,
    mode: SchedulerMode,
    dir: -1 | 1,
): Date => {
    const next = addDays(date, MODE_DAYS[mode] * dir);

    return mode === 'week' ? startOfWeek(next, { weekStartsOn: 1 }) : next;
};

export const hourLabelOffsetClass = (hour: number): string => {
    if (hour === 24) return '-translate-x-full';
    if (hour === 0) return 'translate-x-0';

    return '-translate-x-1/2';
};
