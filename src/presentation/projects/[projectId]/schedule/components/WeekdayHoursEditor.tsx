'use client';

import { WEEKDAYS_MON_FIRST } from '@/shared/constants';
import { Checkbox, Field, FieldLabel, TimePicker } from '@/ui/Base';
import { type DayRow, OFF_DAY } from '../lib/weeklyTemplate';

interface WeekdayHoursEditorProps {
    rows: Record<number, DayRow>;
    onChange: (day: number, patch: Partial<DayRow>) => void;
}

export const WeekdayHoursEditor = ({ rows, onChange }: WeekdayHoursEditorProps) => (
    <Field>
        <FieldLabel>Часы по дням</FieldLabel>
        {WEEKDAYS_MON_FIRST.map(({ day, label }) => {
            const row = rows[day] ?? OFF_DAY;

            return (
                <div
                    key={day}
                    className="flex items-center gap-2"
                >
                    <FieldLabel className="flex w-16 items-center gap-2 capitalize">
                        <Checkbox
                            checked={row.enabled}
                            onCheckedChange={(value) => onChange(day, { enabled: value === true })}
                        />
                        {label}
                    </FieldLabel>
                    <TimePicker
                        value={row.start}
                        disabled={!row.enabled}
                        onValueChange={(value) => onChange(day, { start: value })}
                        className="flex-1"
                    />
                    <span className="text-muted-foreground">–</span>
                    <TimePicker
                        value={row.end}
                        disabled={!row.enabled}
                        onValueChange={(value) => onChange(day, { end: value })}
                        className="flex-1"
                    />
                </div>
            );
        })}
    </Field>
);
