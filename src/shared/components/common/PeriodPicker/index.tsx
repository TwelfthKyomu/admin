'use client';

import { Input, Tabs } from '@/ui/Base';
import type { PeriodParam } from './hooks/usePeriodParam';
import { CUSTOM, PERIOD_ITEMS, type PeriodValue } from './lib/period';

interface PeriodPickerProps {
    state: PeriodParam;
}

export const PeriodPicker = ({ state }: PeriodPickerProps) => (
    <div className="flex flex-wrap items-center gap-2">
        <Tabs<PeriodValue>
            items={PERIOD_ITEMS}
            value={state.period}
            onValueChange={state.selectPeriod}
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
