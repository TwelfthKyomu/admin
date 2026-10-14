import { isSameDay } from 'date-fns';
import { groupByColumn } from '../../lib/lanes';
import type { ScheduleColumn, ScheduleItem } from '../../Scheduler.types';
import { GanttNowLine } from './GanttNowLine';
import { GanttRow } from './GanttRow';
import { GanttSideLabels } from './GanttSideLabels';
import { GanttTimeHeader } from './GanttTimeHeader';

interface GanttTimelineProps<TItem extends ScheduleItem> {
    date: Date;
    columns: readonly ScheduleColumn<TItem>[];
    items: readonly TItem[];
    selectedId?: string;
    onSelect: (id: string) => void;
}

export const GanttTimeline = <TItem extends ScheduleItem>({
    date,
    columns,
    items,
    selectedId,
    onSelect,
}: GanttTimelineProps<TItem>) => {
    const itemsByColumn = groupByColumn(
        columns,
        items.filter((item) => isSameDay(item.start, date)),
    );

    return (
        <div className="border-t border-border flex shrink-0 bg-background h-min">
            <GanttSideLabels
                columns={columns}
                itemsByColumn={itemsByColumn}
            />

            <div className="flex-1 overflow-x-auto overflow-y-hidden relative">
                <div className="relative h-full w-full">
                    <GanttTimeHeader />

                    <div className="relative h-full flex flex-col">
                        <GanttNowLine date={date} />

                        {columns.map((column) => (
                            <GanttRow
                                key={column.id}
                                column={column}
                                items={itemsByColumn[column.id] ?? []}
                                selectedId={selectedId}
                                onSelect={onSelect}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
