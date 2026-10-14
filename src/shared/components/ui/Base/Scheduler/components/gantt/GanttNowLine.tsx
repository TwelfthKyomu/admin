import { fmtTime } from '@/shared/format/date';
import { minutesIntoDay } from '@/shared/lib/dateMath';
import { isSameDay } from 'date-fns';
import { useNowTick } from '../../hooks/useNowTick';

interface GanttNowLineProps {
    date: Date;
}

export const GanttNowLine = ({ date }: GanttNowLineProps) => {
    const now = useNowTick();

    if (!isSameDay(now, date)) return null;

    const dayProgress = minutesIntoDay(now) / 1440;

    return (
        <div
            className="absolute top-0 bottom-0 pointer-events-none z-10"
            style={{
                '--now-progress': dayProgress,
                left: 'calc(var(--now-progress) * 100%)',
                width: '1px',
                borderLeft: '1px dashed #f43f5e',
            }}
        >
            <div
                className="absolute -top-2 -translate-x-1/2 px-1 rounded text-[9px] font-mono tabular-nums text-white whitespace-nowrap"
                style={{ background: '#f43f5e' }}
            >
                {fmtTime(now)}
            </div>
        </div>
    );
};
