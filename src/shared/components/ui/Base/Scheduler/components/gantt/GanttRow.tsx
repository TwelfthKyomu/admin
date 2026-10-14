import type { ScheduleColumn, ScheduleItem } from '@/ui/Base';
import { GanttItemBar } from './GanttItemBar';

interface GanttRowProps<TItem extends ScheduleItem> {
    column: ScheduleColumn<TItem>;
    items: readonly TItem[];
    selectedId?: string;
    onSelect: (id: string) => void;
}

export const GanttRow = <TItem extends ScheduleItem>({
    column,
    items,
    selectedId,
    onSelect,
}: GanttRowProps<TItem>) => {
    const shift = column.workingHours;

    return (
        <div className="w-full left-0 right-0 border-b border-border h-10 relative">
            {shift && (
                <div
                    className="absolute rounded"
                    style={{
                        left: `calc((${shift[0]} / 1440) * 100%)`,
                        width: `calc(((${shift[1]} - ${shift[0]}) / 1440) * 100%)`,
                        top: 4,
                        bottom: 4,
                        background: 'rgba(255, 255, 255, 0.05)',
                    }}
                />
            )}
            {items.map((item) => (
                <GanttItemBar
                    key={item.id}
                    item={item}
                    selected={selectedId === item.id}
                    onSelect={onSelect}
                />
            ))}
        </div>
    );
};
