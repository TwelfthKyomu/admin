'use client';

import { useState } from 'react';
import { CalendarGrid } from './components/CalendarGrid';
import { GanttTimeline } from './components/gantt/GanttTimeline';
import { TopBar } from './components/TopBar';
import { computeRange } from './lib/time';
import type { ScheduleItem, SchedulerProps } from './Scheduler.types';

export { computeRange } from './lib/time';
export type {
    ItemRenderContext,
    ScheduleColumn,
    ScheduleItem,
    SchedulePatch,
    SchedulerMode,
} from './Scheduler.types';

export const Scheduler = <TItem extends ScheduleItem>({
    items,
    date,
    onDateChange,
    mode,
    onModeChange,
    searchPredicate,
    topBarActionsSlot,
    ...gridProps
}: SchedulerProps<TItem>) => {
    const [search, setSearch] = useState('');
    const [selectedId, setSelectedId] = useState<string>();
    const { from, to } = computeRange(date, mode);
    const query = search.trim().toLowerCase();

    const visibleItems = items.filter(
        (item) =>
            item.start < to &&
            item.end > from &&
            (!query || !searchPredicate || searchPredicate(item, query)),
    );

    return (
        <div className="flex flex-col h-full relative overflow-hidden">
            <TopBar
                date={date}
                onDateChange={onDateChange}
                mode={mode}
                onModeChange={onModeChange}
                search={search}
                onSearchChange={setSearch}
                matchedCount={visibleItems.length}
                actionsSlot={topBarActionsSlot}
            />
            <div className="flex-1 min-h-0 h-full w-full">
                <CalendarGrid
                    {...gridProps}
                    items={visibleItems}
                    date={date}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                />
            </div>
            <GanttTimeline
                date={date}
                columns={gridProps.columns}
                items={visibleItems}
                selectedId={selectedId}
                onSelect={setSelectedId}
            />
        </div>
    );
};
