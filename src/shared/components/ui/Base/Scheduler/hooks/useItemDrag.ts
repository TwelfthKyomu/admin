import { useRef, useState } from 'react';
import { minutesIntoDay } from '@/shared/lib/dateMath';
import { addMinutes, differenceInMinutes, startOfDay } from 'date-fns';
import { DAY_MIN, PX_PER_MIN, STEP_MIN } from '../constants';
import { wouldOverlap } from '../lib/lanes';
import { snap } from '../lib/time';
import type {
    CreateDraft,
    DragPreview,
    ScheduleItem,
    SchedulePatch,
    SchedulerProps,
} from '../Scheduler.types';

type UseItemDragOptions<TItem extends ScheduleItem> = Pick<
    SchedulerProps<TItem>,
    | 'columns'
    | 'date'
    | 'onMove'
    | 'onResize'
    | 'onCreate'
    | 'isDragDisabled'
    | 'excludeFromConflict'
> & {
    itemsByColumn: Record<string, TItem[]>;
    onSelect: (id?: string) => void;
};

function suppressNextClick() {
    const stop = (event: MouseEvent) => {
        event.stopPropagation();
        event.preventDefault();
    };

    window.addEventListener('click', stop, { capture: true, once: true });

    window.setTimeout(
        () => window.removeEventListener('click', stop, { capture: true }),
        0,
    );
}

function trackMouse(
    onMove: (event: MouseEvent) => void,
    onEnd: (commit: boolean) => void,
) {
    const move = (event: MouseEvent) =>
        event.buttons === 0 ? end(true) : onMove(event);

    const up = () => end(true);

    const key = (event: KeyboardEvent) => {
        if (event.key === 'Escape') end(false);
    };

    const end = (commit: boolean) => {
        window.removeEventListener('mousemove', move);
        window.removeEventListener('mouseup', up);
        window.removeEventListener('keydown', key);
        onEnd(commit);
    };

    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    window.addEventListener('keydown', key);
}

function columnAt(event: MouseEvent): string | undefined {
    return (
        document
            .elementsFromPoint(event.clientX, event.clientY)
            .find((element) => element.hasAttribute('data-col'))
            ?.getAttribute('data-col') ?? undefined
    );
}

export function useItemDrag<TItem extends ScheduleItem>({
    columns,
    date,
    itemsByColumn,
    onMove,
    onResize,
    onCreate,
    onSelect,
    isDragDisabled,
    excludeFromConflict,
}: UseItemDragOptions<TItem>) {
    const columnRefs = useRef<Record<string, HTMLElement | null>>({});
    const [drag, setDrag] = useState<DragPreview>();
    const [createDraft, setCreateDraft] = useState<CreateDraft>();

    const minutesAt = (clientY: number, columnId: string) => {
        const top =
            columnRefs.current[columnId]?.getBoundingClientRect().top ??
            clientY;

        return (clientY - top) / PX_PER_MIN;
    };

    const slotAt = (clientY: number, columnId: string) =>
        Math.max(0, Math.min(DAY_MIN, snap(minutesAt(clientY, columnId))));

    const toPatch = (
        columnId: string,
        startMin: number,
        dur: number,
    ): SchedulePatch => {
        const day =
            columns.find((column) => column.id === columnId)?.date ?? date;

        const start = addMinutes(startOfDay(day), startMin);

        return { start, end: addMinutes(start, dur), columnId };
    };

    const hasConflict = (
        item: TItem,
        columnId: string,
        startMin: number,
        dur: number,
    ) =>
        wouldOverlap(
            itemsByColumn[columnId] ?? [],
            startMin,
            dur,
            item.id,
            excludeFromConflict,
        );

    const grab = (event: MouseEvent, item: TItem) => {
        if (isDragDisabled?.(item) || event.button !== 0) return false;

        event.preventDefault();
        event.stopPropagation();
        onSelect(item.id);

        return true;
    };

    const startMove = (event: MouseEvent, item: TItem, columnId: string) => {
        if (!grab(event, item)) return;

        const initialStart = minutesIntoDay(item.start);
        const dur = differenceInMinutes(item.end, item.start);
        const offset = snap(minutesAt(event.clientY, columnId) - initialStart);
        let column = columnId;
        let startMin = initialStart;
        let conflict = false;
        let moved = false;

        trackMouse(
            (move) => {
                if (
                    !moved &&
                    Math.abs(move.clientY - event.clientY) < 3 &&
                    Math.abs(move.clientX - event.clientX) < 3
                ) {
                    return;
                }

                moved = true;
                column = columnAt(move) ?? column;

                startMin = Math.max(
                    0,
                    Math.min(
                        DAY_MIN - dur,
                        snap(slotAt(move.clientY, column) - offset),
                    ),
                );

                conflict = hasConflict(item, column, startMin, dur);
                setDrag({ id: item.id, startMin, dur, conflict });
            },
            (commit) => {
                if (moved) suppressNextClick();

                const changed =
                    column !== columnId || startMin !== initialStart;

                if (commit && moved && changed && !conflict)
                    onMove?.(item, toPatch(column, startMin, dur));

                setDrag(undefined);
            },
        );
    };

    const startResize = (event: MouseEvent, item: TItem, columnId: string) => {
        if (!grab(event, item)) return;

        const startMin = minutesIntoDay(item.start);
        const initialDur = differenceInMinutes(item.end, item.start);
        let dur = initialDur;
        let conflict = false;

        trackMouse(
            (move) => {
                const delta = snap((move.clientY - event.clientY) / PX_PER_MIN);

                dur = Math.max(
                    STEP_MIN,
                    Math.min(DAY_MIN - startMin, initialDur + delta),
                );

                conflict = hasConflict(item, columnId, startMin, dur);
                setDrag({ id: item.id, startMin, dur, conflict });
            },
            (commit) => {
                if (dur !== initialDur) suppressNextClick();
                if (commit && !conflict && dur !== initialDur)
                    onResize?.(item, toPatch(columnId, startMin, dur));

                setDrag(undefined);
            },
        );
    };

    const startCreate = (event: MouseEvent, columnId: string) => {
        if (!onCreate || event.button !== 0) return;

        event.preventDefault();
        onSelect();

        const anchor = slotAt(event.clientY, columnId);
        let startMin = anchor;
        let dur = STEP_MIN * 2;
        let dragged = false;

        trackMouse(
            (move) => {
                if (!dragged && Math.abs(move.clientY - event.clientY) < 4)
                    return;

                const current = slotAt(move.clientY, columnId);

                dragged = true;
                startMin = Math.min(anchor, current);
                dur = Math.abs(current - anchor) + STEP_MIN;
                setCreateDraft({ columnId, startMin, dur });
            },
            (commit) => {
                setCreateDraft(undefined);

                if (dragged) suppressNextClick();
                if (commit) onCreate(toPatch(columnId, startMin, dur));
            },
        );
    };

    return {
        columnRefs,
        drag,
        createDraft,
        startMove,
        startResize,
        startCreate,
    };
}
