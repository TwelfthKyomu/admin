import { useRef } from 'react';
import { cn } from '@/shared/lib/utils';
import { Clock } from 'lucide-react';
import { DAY_MIN, GRID_HEADER_H, GRID_TIME_W, HOUR_PX, PX_PER_MIN, STEP_MIN } from '../constants';
import { useGridAutoScroll } from '../hooks/useGridAutoScroll';
import { useItemDrag } from '../hooks/useItemDrag';
import { assignLanes, groupByColumn } from '../lib/lanes';
import type { ScheduleItem, SchedulerProps } from '../Scheduler.types';
import { CreatePreview } from './grid/CreatePreview';
import { NowLine } from './grid/NowLine';
import { OffHoursBand } from './grid/OffHoursBand';
import { WorkHoursBand } from './grid/WorkHoursBand';

type CalendarGridProps<TItem extends ScheduleItem> = Pick<
    SchedulerProps<TItem>,
    | 'columns'
    | 'items'
    | 'date'
    | 'renderItem'
    | 'onMove'
    | 'onResize'
    | 'onCreate'
    | 'isDragDisabled'
    | 'excludeFromConflict'
> & {
    selectedId?: string;
    onSelect: (id?: string) => void;
};

const GRID_LINES =
    `repeating-linear-gradient(to bottom, rgba(127,127,127,0.30) 0 1px, transparent 1px ${HOUR_PX}px),` +
    `repeating-linear-gradient(to bottom, rgba(127,127,127,0.15) 0 1px, transparent 1px ${STEP_MIN * PX_PER_MIN}px)`;

export const CalendarGrid = <TItem extends ScheduleItem>({
    columns,
    items,
    selectedId,
    renderItem,
    onSelect,
    onCreate,
    ...dragOptions
}: CalendarGridProps<TItem>) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const itemsByColumn = groupByColumn(columns, items);

    const { columnRefs, drag, createDraft, startMove, startResize, startCreate } = useItemDrag({
        columns,
        itemsByColumn,
        onCreate,
        onSelect,
        ...dragOptions,
    });

    useGridAutoScroll(
        scrollRef,
        columns.some((column) => column.showNow),
    );

    return (
        <div
            ref={scrollRef}
            className="relative h-full w-full overflow-y-auto overflow-x-hidden"
        >
            <div
                className="sticky top-0 z-30 flex bg-background border-b border-border"
                style={{ height: GRID_HEADER_H }}
            >
                <div
                    className="sticky left-0 z-10 flex items-center justify-center bg-background border-r border-border"
                    style={{ width: GRID_TIME_W }}
                >
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                {columns.map((column, index) => (
                    <div
                        key={column.id}
                        className={cn(
                            'flex items-center gap-2.5 px-3 bg-background',
                            index < columns.length - 1 && 'border-r border-border',
                        )}
                        style={{ flex: '1 1 0', minWidth: column.minWidth ?? 0 }}
                    >
                        {column.header}
                    </div>
                ))}
            </div>

            <div
                className="flex"
                style={{ minHeight: DAY_MIN * PX_PER_MIN }}
            >
                <TimeAxis />

                {columns.map((column, index) => {
                    const [workStart, workEnd] = column.workingHours ?? [0, DAY_MIN];

                    return (
                        // biome-ignore lint/a11y/noStaticElementInteractions: drag-canvas
                        <div
                            key={column.id}
                            ref={(element) => {
                                columnRefs.current[column.id] = element;
                            }}
                            data-col={column.id}
                            className={cn(
                                'relative isolate bg-background',
                                onCreate && 'cursor-crosshair',
                                index < columns.length - 1 && 'border-r border-border',
                            )}
                            onMouseDown={
                                onCreate
                                    ? (event) => startCreate(event.nativeEvent, column.id)
                                    : () => onSelect()
                            }
                            style={{
                                flex: '1 1 0',
                                minWidth: column.minWidth ?? 0,
                                minHeight: DAY_MIN * PX_PER_MIN,
                                backgroundImage: GRID_LINES,
                            }}
                        >
                            {workStart > 0 && (
                                <OffHoursBand
                                    top={0}
                                    height={workStart * PX_PER_MIN}
                                />
                            )}
                            {workEnd < DAY_MIN && (
                                <OffHoursBand
                                    top={workEnd * PX_PER_MIN}
                                    height={(DAY_MIN - workEnd) * PX_PER_MIN}
                                />
                            )}
                            <WorkHoursBand
                                top={workStart * PX_PER_MIN}
                                height={(workEnd - workStart) * PX_PER_MIN}
                            />

                            {column.showNow && <NowLine />}

                            {assignLanes(itemsByColumn[column.id] ?? []).map((item) => {
                                const dragging = drag?.id === item.id;

                                return renderItem({
                                    item,
                                    selected: selectedId === item.id,
                                    dragging,
                                    conflict: dragging && drag.conflict,
                                    override: dragging
                                        ? { startMin: drag.startMin, dur: drag.dur }
                                        : undefined,
                                    lane: item.lane,
                                    lanes: item.lanes,
                                    pxPerMin: PX_PER_MIN,
                                    onMouseDown: (event) =>
                                        startMove(event.nativeEvent, item, column.id),
                                    onResizeMouseDown: (event) =>
                                        startResize(event.nativeEvent, item, column.id),
                                    onClick: (event) => {
                                        event.stopPropagation();
                                        onSelect(item.id);
                                    },
                                });
                            })}

                            {createDraft?.columnId === column.id && (
                                <CreatePreview
                                    startMin={createDraft.startMin}
                                    dur={createDraft.dur}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const TimeAxis = () => (
    <div
        className="sticky left-0 z-20 bg-background border-r border-border"
        style={{ width: GRID_TIME_W, minHeight: DAY_MIN * PX_PER_MIN }}
    >
        {Array.from({ length: 24 }, (_, hour) => (
            <div
                key={hour}
                className={cn(
                    'absolute right-2 text-[10px] font-mono tracking-wider tabular-nums',
                    hour % 6 === 0 ? 'text-muted-foreground' : 'text-muted-foreground/60',
                )}
                style={{ top: hour * HOUR_PX - 6 }}
            >
                {String(hour).padStart(2, '0')}:00
            </div>
        ))}
    </div>
);
