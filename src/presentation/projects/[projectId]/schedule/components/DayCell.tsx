import type { Currency } from '@/shared/constants/currency';
import { cn } from '@/shared/lib/utils';
import { type MonthDay, salesAmount } from '../lib/monthGrid';

interface DayCellProps {
    day: MonthDay;
    currency: Currency;
    onPick: (date: Date) => void;
    selectable?: boolean;
    selected?: boolean;
    onToggle?: (date: Date) => void;
}

const MAX_SHIFT_AVATARS = 3;

export const DayCell = ({
    day,
    currency,
    onPick,
    selectable = false,
    selected = false,
    onToggle,
}: DayCellProps) => {
    const sales = day.sales;
    const shiftEmpIds = Array.from(new Set(day.shifts.map((shift) => shift.employeeId)));

    return (
        <button
            type="button"
            onClick={() => (selectable ? onToggle?.(day.date) : onPick(day.date))}
            aria-pressed={selectable ? selected : undefined}
            className={cn(
                'flex flex-col gap-1.5 p-2 text-left border-r border-b border-border bg-background transition-colors hover:bg-muted/40',
                !day.isInCurrentMonth && 'bg-muted/20 text-muted-foreground/60',
                selected && 'bg-primary/10 ring-1 ring-inset ring-primary hover:bg-primary/15',
            )}
        >
            <div className="flex items-center justify-between">
                <div
                    className={cn(
                        'h-6 min-w-6 px-1.5 inline-flex items-center justify-center rounded-md text-[12px] font-semibold tabular-nums',
                        day.isToday ? 'bg-primary text-primary-foreground' : 'text-foreground',
                    )}
                >
                    {day.date.getDate()}
                </div>
                {sales.length > 0 && (
                    <span className="text-[10px] font-mono tabular-nums text-muted-foreground">
                        {sales.length}
                    </span>
                )}
            </div>

            {sales.length > 0 && (
                <span className="text-[11px] font-mono tabular-nums text-emerald-500">
                    {salesAmount(sales, currency)}
                </span>
            )}

            {shiftEmpIds.length > 0 && (
                <div className="flex items-center -space-x-1 mt-auto">
                    {shiftEmpIds.slice(0, MAX_SHIFT_AVATARS).map((id) => (
                        <span
                            key={id}
                            className="w-4 h-4 rounded-full border border-background bg-muted-foreground/40"
                        />
                    ))}
                    {shiftEmpIds.length > MAX_SHIFT_AVATARS && (
                        <span className="ml-1 text-[9px] text-muted-foreground tabular-nums">
                            +{shiftEmpIds.length - MAX_SHIFT_AVATARS}
                        </span>
                    )}
                </div>
            )}
        </button>
    );
};
