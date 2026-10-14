'use client';

import { Input, Tabs } from '@/ui/Base';
import {
    addDays,
    addMonths,
    format,
    isValid,
    parseISO,
    startOfMonth,
    subDays,
    subMilliseconds,
    subMonths,
} from 'date-fns';
import { parseAsString, parseAsStringLiteral, useQueryState } from 'nuqs';

const CUSTOM = 'custom';

const PERIOD_ITEMS = [
    { value: 'month', label: 'Этот месяц' },
    { value: 'prev', label: 'Прошлый месяц' },
    { value: '30d', label: '30 дней' },
    { value: CUSTOM, label: 'Период…' },
] as const;

const PERIOD_VALUES = PERIOD_ITEMS.map((item) => item.value);

type PeriodValue = (typeof PERIOD_ITEMS)[number]['value'];

function presetRange(period: PeriodValue): { from: Date; to: Date } {
    const now = new Date();

    if (period === '30d') return { from: subDays(now, 30), to: now };

    const from = startOfMonth(period === 'prev' ? subMonths(now, 1) : now);

    return { from, to: addMonths(from, 1) };
}

function parseDay(value: string): Date | undefined {
    const date = parseISO(value);

    return isValid(date) ? date : undefined;
}

export function usePeriodParam() {
    const [period, setPeriod] = useQueryState(
        'period',
        parseAsStringLiteral(PERIOD_VALUES).withDefault('month'),
    );

    const [fromParam, setFrom] = useQueryState('from', parseAsString.withDefault(''));
    const [toParam, setTo] = useQueryState('to', parseAsString.withDefault(''));

    const fallback = presetRange(period);
    const customFrom = parseDay(fromParam);
    const customTo = parseDay(toParam);

    const range =
        period === CUSTOM && customFrom && customTo && customTo > customFrom
            ? { from: customFrom, to: addDays(customTo, 1) }
            : fallback;

    return {
        period,
        range,
        fromDay: fromParam || format(fallback.from, 'yyyy-MM-dd'),
        toDay: toParam || format(subMilliseconds(fallback.to, 1), 'yyyy-MM-dd'),
        setPeriod: (next: PeriodValue) => void setPeriod(next),
        setFromDay: (value: string) => void setFrom(value),
        setToDay: (value: string) => void setTo(value),
    };
}

type PeriodParam = ReturnType<typeof usePeriodParam>;

interface PeriodPickerProps {
    state: PeriodParam;
}

export const PeriodPicker = ({ state }: PeriodPickerProps) => (
    <div className="flex flex-wrap items-center gap-2">
        <Tabs<PeriodValue>
            items={PERIOD_ITEMS}
            value={state.period}
            onValueChange={(next) => {
                if (next === CUSTOM) {
                    state.setFromDay(state.fromDay);
                    state.setToDay(state.toDay);
                }

                state.setPeriod(next);
            }}
        />
        {state.period === CUSTOM && (
            <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                <Input
                    type="date"
                    aria-label="Начало периода"
                    value={state.fromDay}
                    onChange={(event) => state.setFromDay(event.target.value)}
                    className="h-8 w-36"
                />
                —
                <Input
                    type="date"
                    aria-label="Конец периода"
                    value={state.toDay}
                    onChange={(event) => state.setToDay(event.target.value)}
                    className="h-8 w-36"
                />
            </div>
        )}
    </div>
);
