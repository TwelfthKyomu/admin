'use client';

import { addDays, format, subMilliseconds } from 'date-fns';
import { parseAsString, parseAsStringLiteral, useQueryState } from 'nuqs';
import {
    CUSTOM,
    PERIOD_VALUES,
    type PeriodValue,
    parseDay,
    presetRange,
} from '../lib/period';

export const usePeriodParam = () => {
    const [period, setPeriod] = useQueryState(
        'period',
        parseAsStringLiteral(PERIOD_VALUES).withDefault('month'),
    );

    const [fromParam, setFrom] = useQueryState(
        'from',
        parseAsString.withDefault(''),
    );

    const [toParam, setTo] = useQueryState('to', parseAsString.withDefault(''));

    const fallback = presetRange(period);
    const customFrom = parseDay(fromParam);
    const customTo = parseDay(toParam);
    const fromDay = fromParam || format(fallback.from, 'yyyy-MM-dd');

    const toDay =
        toParam || format(subMilliseconds(fallback.to, 1), 'yyyy-MM-dd');

    const range =
        period === CUSTOM && customFrom && customTo && customTo > customFrom
            ? { from: customFrom, to: addDays(customTo, 1) }
            : fallback;

    const selectPeriod = (next: PeriodValue) => {
        if (next === CUSTOM) {
            void setFrom(fromDay);
            void setTo(toDay);
        }

        void setPeriod(next);
    };

    return {
        period,
        range,
        fromDay,
        toDay,
        selectPeriod,
        setFromDay: (value: string) => void setFrom(value),
        setToDay: (value: string) => void setTo(value),
    };
};

export type PeriodParam = ReturnType<typeof usePeriodParam>;
