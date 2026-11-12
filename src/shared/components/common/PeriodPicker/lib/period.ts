import {
    addMonths,
    isValid,
    parseISO,
    startOfMonth,
    subDays,
    subMonths,
} from 'date-fns';

export const CUSTOM = 'custom';

export const PERIOD_ITEMS = [
    { value: 'month', label: 'Этот месяц' },
    { value: 'prev', label: 'Прошлый месяц' },
    { value: '30d', label: '30 дней' },
    { value: CUSTOM, label: 'Период…' },
] as const;

export const PERIOD_VALUES = PERIOD_ITEMS.map((item) => item.value);

export type PeriodValue = (typeof PERIOD_ITEMS)[number]['value'];

export const presetRange = (period: PeriodValue): { from: Date; to: Date } => {
    const now = new Date();

    if (period === '30d') return { from: subDays(now, 30), to: now };

    const from = startOfMonth(period === 'prev' ? subMonths(now, 1) : now);

    return { from, to: addMonths(from, 1) };
};

export const parseDay = (value: string): Date | undefined => {
    const date = parseISO(value);

    return isValid(date) ? date : undefined;
};
