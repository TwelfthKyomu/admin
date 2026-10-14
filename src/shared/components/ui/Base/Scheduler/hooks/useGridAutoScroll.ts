import { type RefObject, useEffect } from 'react';
import { minutesIntoDay } from '@/shared/lib/dateMath';
import { HOUR_PX, PX_PER_MIN } from '../constants';

export function useGridAutoScroll(
    scrollRef: RefObject<HTMLDivElement | null>,
    showsNow: boolean,
): void {
    useEffect(() => {
        if (!scrollRef.current) return;

        scrollRef.current.scrollTop = showsNow
            ? Math.max(0, (minutesIntoDay(new Date()) - 90) * PX_PER_MIN)
            : 8.5 * HOUR_PX;
    }, [scrollRef, showsNow]);
}
