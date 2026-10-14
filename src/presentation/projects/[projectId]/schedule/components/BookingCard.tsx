import { fmtTime, fmtTimeRange } from '@/shared/format/date';
import { minutesIntoDay } from '@/shared/lib/dateMath';
import { cn } from '@/shared/lib/utils';
import { OrderStatus } from '@/contexts/order';
import type { ItemRenderContext } from '@/ui/Base/Scheduler';
import { addMinutes, differenceInMinutes, startOfDay } from 'date-fns';
import type { ScheduleBooking } from '../lib/mapToScheduler';

const STATUS_STYLES: Record<OrderStatus, string> = {
    [OrderStatus.PENDING]: 'border-l-amber-500 bg-amber-500/10',
    [OrderStatus.CONFIRMED]: 'border-l-blue-500 bg-blue-500/10',
    [OrderStatus.IN_PROGRESS]: 'border-l-emerald-500 bg-emerald-500/10',
    [OrderStatus.COMPLETED]: 'border-l-emerald-700 bg-muted/60 opacity-70',
    [OrderStatus.CANCELLED]: 'border-l-muted-foreground/40 bg-muted/40 opacity-50',
    [OrderStatus.NO_SHOW]: 'border-l-destructive bg-destructive/5 opacity-60',
};

export const BookingCard = ({
    item,
    selected,
    dragging,
    conflict,
    override,
    lane,
    lanes,
    pxPerMin,
    onMouseDown,
    onResizeMouseDown,
    onClick,
}: ItemRenderContext<ScheduleBooking>) => {
    const startMin = override?.startMin ?? minutesIntoDay(item.start);
    const durationMin = override?.dur ?? differenceInMinutes(item.end, item.start);
    const visualStart = addMinutes(startOfDay(item.start), startMin);
    const visualEnd = addMinutes(visualStart, durationMin);
    const compact = durationMin * pxPerMin < 40;

    return (
        <div
            key={item.id}
            role="button"
            tabIndex={0}
            aria-label={`Запись ${fmtTime(visualStart)}–${fmtTime(visualEnd)}, ${item.order.customerName ?? 'без имени'}`}
            onMouseDown={onMouseDown}
            onClick={onClick}
            onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onClick(event);
                }
            }}
            className={cn(
                'absolute z-10 flex flex-col gap-0.5 overflow-hidden rounded-md border border-border border-l-2 px-1.5 py-1 text-left text-[11px] leading-tight select-none cursor-grab',
                STATUS_STYLES[item.order.status],
                selected && 'ring-2 ring-primary z-20',
                dragging && 'opacity-80 shadow-lg z-30 cursor-grabbing',
                conflict && 'ring-2 ring-destructive',
            )}
            style={{
                top: startMin * pxPerMin,
                height: Math.max(durationMin * pxPerMin, 18),
                left: `calc(${(lane / lanes) * 100}% + 2px)`,
                width: `calc(${100 / lanes}% - 4px)`,
            }}
        >
            <span className="font-mono tabular-nums text-[10px] text-muted-foreground">
                {fmtTimeRange(visualStart, visualEnd)}
            </span>
            {!compact && (
                <span className="font-medium truncate">
                    {item.order.customerName ?? 'Без имени'}
                </span>
            )}
            <div
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-1.5 cursor-ns-resize"
                onMouseDown={onResizeMouseDown}
            />
        </div>
    );
};
