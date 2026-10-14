import { cn } from '@/shared/lib/utils';
import { GANTT_TIME_H } from '../../constants';

export const GanttTimeHeader = () => {
    return (
        <div
            className="w-full top-0 z-10 border-b border-border grid"
            style={{
                height: GANTT_TIME_H,
                gridTemplateColumns: 'repeat(24, minmax(0, 1fr))',
            }}
        >
            {Array.from({ length: 25 }, (_, h) => (
                <div
                    key={h}
                    className={cn(
                        'text-[10px] font-mono tabular-nums relative h-full flex items-center',
                        h % 6 === 0
                            ? 'text-muted-foreground font-bold'
                            : 'text-muted-foreground/60',
                    )}
                    style={{
                        gridColumnStart: h + 1,
                    }}
                >
                    <span
                        className={cn(
                            'absolute transform',
                            h === 24
                                ? '-translate-x-full'
                                : h === 0
                                  ? 'translate-x-0'
                                  : '-translate-x-1/2',
                        )}
                    >
                        {String(h === 24 ? 24 : h).padStart(2, '0')}
                    </span>
                </div>
            ))}
        </div>
    );
};
