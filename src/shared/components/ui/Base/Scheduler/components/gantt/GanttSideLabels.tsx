import type { ScheduleColumn, ScheduleItem } from '@/ui/Base';
import { Activity } from 'lucide-react';
import { GANTT_LABEL_W, GANTT_TIME_H } from '../../constants';

interface GanttSideLabelsProps<TItem extends ScheduleItem> {
    columns: readonly ScheduleColumn<TItem>[];
    itemsByColumn: Record<string, TItem[]>;
}

export const GanttSideLabels = <TItem extends ScheduleItem>({
    columns,
    itemsByColumn,
}: GanttSideLabelsProps<TItem>) => (
    <div
        className="shrink-0 bg-card border-r border-border"
        style={{ width: GANTT_LABEL_W }}
    >
        <div
            className="px-3 flex items-center justify-between border-b border-border bg-background"
            style={{ height: GANTT_TIME_H }}
        >
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-medium text-muted-foreground whitespace-nowrap">
                <Activity className="h-3 w-3" />
                Загрузка
            </div>
        </div>
        {columns.map((column) => (
            <div
                key={column.id}
                className="flex items-center gap-2 px-3 border-b border-border bg-background h-10"
            >
                <div className="text-[11.5px] truncate text-muted-foreground">{column.header}</div>
                <div className="ml-auto text-[10px] font-mono tabular-nums text-muted-foreground/70">
                    {itemsByColumn[column.id]?.length ?? 0}
                </div>
            </div>
        ))}
    </div>
);
