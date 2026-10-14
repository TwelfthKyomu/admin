import { minutesIntoDay } from '@/shared/lib/dateMath';
import { PX_PER_MIN } from '../../constants';
import { useNowTick } from '../../hooks/useNowTick';

export const NowLine = () => {
    const now = useNowTick();

    return (
        <div
            className="absolute left-0 right-0 z-30 pointer-events-none"
            style={{
                top: minutesIntoDay(now) * PX_PER_MIN,
                borderTop: '1px solid #f43f5e',
                height: 0,
            }}
        >
            <span
                className="absolute -left-1 -top-1 w-2.5 h-2.5 rounded-full"
                style={{
                    background: '#f43f5e',
                    boxShadow: '0 0 0 3px rgba(244,63,94,0.18)',
                }}
            />
        </div>
    );
};
