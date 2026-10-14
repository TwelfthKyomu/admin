import type { Option } from '@/shared/types';
import { Badge, Spinner } from '@/ui/Base';

interface ScheduleFooterProps {
    isLoading: boolean;
    stats: Option<number>[];
}

export const ScheduleFooter = ({ isLoading, stats }: ScheduleFooterProps) => (
    <div className="shrink-0 h-9 px-4 flex items-center justify-between gap-3 border-t border-border bg-background text-[11px] text-muted-foreground">
        <div className="flex items-center gap-2">
            {stats.map((stat) => (
                <Badge
                    key={stat.label}
                    variant="outline"
                    className="font-mono tabular-nums"
                >
                    {stat.label}: {stat.value}
                </Badge>
            ))}
        </div>
        <div className="flex items-center gap-1.5">
            {isLoading ? (
                <>
                    <Spinner className="size-3" />
                    Загрузка…
                </>
            ) : (
                <span className="opacity-40">Актуально</span>
            )}
        </div>
    </div>
);
