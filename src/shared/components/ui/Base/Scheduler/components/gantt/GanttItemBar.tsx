import { fmtTime } from '@/shared/format/date';
import { minutesIntoDay } from '@/shared/lib/dateMath';
import { cn } from '@/shared/lib/utils';
import { Button, type ScheduleItem } from '@/ui/Base';
import { differenceInMinutes } from 'date-fns';
import { GANTT_BAR_COLOR, PX_PER_MIN } from '../../constants';

interface GanttItemBarProps<TItem extends ScheduleItem> {
    item: TItem;
    selected: boolean;
    onSelect: (id: string) => void;
}

export const GanttItemBar = <TItem extends ScheduleItem>({
    item,
    selected,
    onSelect,
}: GanttItemBarProps<TItem>) => {
    const startMin = minutesIntoDay(item.start);
    const dur = differenceInMinutes(item.end, item.start);
    const width = Math.max(2, dur * PX_PER_MIN);

    return (
        <Button
            type="button"
            onClick={() => onSelect(item.id)}
            className={cn(
                'absolute top-2 bottom-2 rounded overflow-hidden transition-[filter] hover:brightness-125 h-auto',
                selected && 'outline outline-offset-1 outline-primary',
            )}
            style={{
                left: `${(startMin / 1440) * 100}%`,
                width: `${(dur / 1440) * 100}%`,
                background: `${GANTT_BAR_COLOR}33`,
                border: `1px solid ${GANTT_BAR_COLOR}66`,
            }}
            title={fmtTime(item.start)}
        >
            {width > 60 && (
                <div className="px-1.5 pt-0.5 text-[10px] leading-tight truncate text-left">
                    <span className="font-mono opacity-60 tabular-nums">{fmtTime(item.start)}</span>
                </div>
            )}
        </Button>
    );
};
