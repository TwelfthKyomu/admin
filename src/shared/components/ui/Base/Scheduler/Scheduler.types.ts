import type { KeyboardEvent, MouseEvent, ReactNode } from 'react';

export type SchedulerMode = 'day' | '3day' | 'week';

export interface ScheduleItem {
    id: string;
    start: Date;
    end: Date;
}

export interface ScheduleColumn<TItem extends ScheduleItem = ScheduleItem> {
    id: string;
    header: ReactNode;
    match: (item: TItem) => boolean;
    workingHours?: readonly [number, number];
    minWidth?: number;
    showNow?: boolean;
    date?: Date;
}

export interface SchedulePatch {
    start: Date;
    end: Date;
    columnId: string;
}

export interface ItemRenderContext<TItem extends ScheduleItem> {
    item: TItem;
    selected: boolean;
    dragging: boolean;
    conflict: boolean;
    override?: { startMin: number; dur: number };
    lane: number;
    lanes: number;
    pxPerMin: number;
    onMouseDown: (e: MouseEvent) => void;
    onResizeMouseDown: (e: MouseEvent) => void;
    onClick: (e: MouseEvent | KeyboardEvent) => void;
}

export interface SchedulerProps<TItem extends ScheduleItem> {
    items: readonly TItem[];
    columns: readonly ScheduleColumn<TItem>[];
    renderItem: (ctx: ItemRenderContext<TItem>) => ReactNode;
    date: Date;
    onDateChange: (date: Date) => void;
    mode: SchedulerMode;
    onModeChange: (mode: SchedulerMode) => void;
    searchPredicate?: (item: TItem, query: string) => boolean;
    onMove?: (item: TItem, patch: SchedulePatch) => void;
    onResize?: (item: TItem, patch: SchedulePatch) => void;
    onCreate?: (patch: SchedulePatch) => void;
    isDragDisabled?: (item: TItem) => boolean;
    excludeFromConflict?: (item: TItem) => boolean;
    topBarActionsSlot?: ReactNode;
}

export type LanedItem<TItem extends ScheduleItem> = TItem & {
    lane: number;
    lanes: number;
};

export interface DragPreview {
    id: string;
    startMin: number;
    dur: number;
    conflict: boolean;
}

export interface CreateDraft {
    columnId: string;
    startMin: number;
    dur: number;
}
