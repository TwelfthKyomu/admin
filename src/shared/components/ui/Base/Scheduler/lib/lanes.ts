import { minutesIntoDay } from '@/shared/lib/dateMath';
import { differenceInMinutes } from 'date-fns';
import type {
    LanedItem,
    ScheduleColumn,
    ScheduleItem,
} from '../Scheduler.types';

export function groupByColumn<TItem extends ScheduleItem>(
    columns: readonly ScheduleColumn<TItem>[],
    items: readonly TItem[],
): Record<string, TItem[]> {
    const groups: Record<string, TItem[]> = {};

    for (const column of columns) {
        groups[column.id] = items.filter((item) => column.match(item));
    }

    return groups;
}

export function assignLanes<TItem extends ScheduleItem>(
    items: readonly TItem[],
): LanedItem<TItem>[] {
    const sorted = [...items].sort(
        (a, b) => +a.start - +b.start || +a.end - +b.end,
    );

    const result: LanedItem<TItem>[] = [];
    let cluster: { item: TItem; lane: number }[] = [];
    let clusterEnd = -Infinity;

    const flush = () => {
        const lanes = Math.max(1, ...cluster.map(({ lane }) => lane + 1));

        for (const { item, lane } of cluster)
            result.push({ ...item, lane, lanes });

        cluster = [];
    };

    for (const item of sorted) {
        if (+item.start >= clusterEnd) flush();

        const occupied = new Set(
            cluster
                .filter((placed) => +placed.item.end > +item.start)
                .map(({ lane }) => lane),
        );

        let lane = 0;

        while (occupied.has(lane)) lane++;

        cluster.push({ item, lane });
        clusterEnd = Math.max(clusterEnd, +item.end);
    }

    flush();

    return result;
}

export function wouldOverlap<TItem extends ScheduleItem>(
    items: readonly TItem[],
    startMin: number,
    durMin: number,
    ignoreId: string,
    exclude?: (item: TItem) => boolean,
): boolean {
    return items.some((item) => {
        if (item.id === ignoreId || exclude?.(item)) return false;

        const itemStart = minutesIntoDay(item.start);

        return (
            itemStart < startMin + durMin &&
            itemStart + differenceInMinutes(item.end, item.start) > startMin
        );
    });
}
