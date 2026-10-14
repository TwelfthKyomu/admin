import type { SchedulerMode } from './Scheduler.types';

export const STEP_MIN = 30;

export const PX_PER_MIN = 1;

export const HOUR_PX = 60 * PX_PER_MIN;

export const DAY_MIN = 24 * 60;

export const GRID_HEADER_H = 56;

export const GRID_TIME_W = 60;

export const GANTT_TIME_H = 28;

export const GANTT_LABEL_W = 168;

export const GANTT_BAR_COLOR = '#8b5cf6';

export const MODES: readonly SchedulerMode[] = ['day', '3day', 'week'];

export const MODE_DAYS: Record<SchedulerMode, number> = {
    day: 1,
    '3day': 3,
    week: 7,
};

export const MODE_LABELS: Record<SchedulerMode, string> = {
    day: 'День',
    '3day': '3 дня',
    week: 'Неделя',
};
