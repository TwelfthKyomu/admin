import { WEEKDAYS_MON_FIRST } from '@/shared/constants';
import { fmtMonth } from '@/shared/format/date';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/ui/Base';
import { addMonths, format } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { MonthDay } from '../lib/monthGrid';
import { DayCell } from './DayCell';

interface MonthCalendarProps {
    date: Date;
    days: MonthDay[];
    onDateChange: (d: Date) => void;
    onPickDay: (d: Date) => void;
    className?: string;
    selectable?: boolean;
    selectedKeys?: ReadonlySet<string>;
    onToggleDay?: (d: Date) => void;
}

export const MonthCalendar = ({
    date,
    days,
    onDateChange,
    onPickDay,
    className,
    selectable = false,
    selectedKeys,
    onToggleDay,
}: MonthCalendarProps) => {
    const shiftMonth = (delta: number) => onDateChange(addMonths(date, delta));

    return (
        <div className={cn('flex flex-col bg-background', className)}>
            <div className="flex items-center gap-2 px-4 h-12 border-b border-border">
                <h2 className="text-[14px] font-semibold tabular-nums capitalize">
                    {fmtMonth(date)}
                </h2>
                <div className="ml-auto flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Предыдущий месяц"
                        onClick={() => shiftMonth(-1)}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDateChange(new Date())}
                    >
                        Сегодня
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Следующий месяц"
                        onClick={() => shiftMonth(1)}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-7 border-b">
                {WEEKDAYS_MON_FIRST.map(({ day, label }) => (
                    <span
                        key={day}
                        className="text-[10px] uppercase font-medium text-muted-foreground px-2 py-1.5 border-r"
                    >
                        {label}
                    </span>
                ))}
            </div>

            <div className="grid grid-cols-7 grid-rows-6 flex-1 min-h-120">
                {days.map((day) => (
                    <DayCell
                        key={day.date.toISOString()}
                        day={day}
                        onPick={onPickDay}
                        selectable={selectable}
                        selected={selectedKeys?.has(format(day.date, 'yyyy-MM-dd')) ?? false}
                        onToggle={onToggleDay}
                    />
                ))}
            </div>
        </div>
    );
};
