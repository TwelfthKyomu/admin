import { ROUTES } from '@/shared/constants';
import { fmtTime } from '@/shared/format/date';
import { fmtMoney } from '@/shared/format/money';
import { minutesIntoDay } from '@/shared/lib/dateMath';
import { cn } from '@/shared/lib/utils';
import type { ItemRenderContext } from '@/ui/Base/Scheduler';
import { differenceInMinutes } from 'date-fns';
import Link from 'next/link';
import type { ScheduleSale } from '../lib/mapToScheduler';
import { saleCardLabel } from '../lib/saleCard';

export const SaleCard = ({
    item,
    selected,
    lane,
    lanes,
    pxPerMin,
}: ItemRenderContext<ScheduleSale>) => {
    const startMin = minutesIntoDay(item.start);
    const durationMin = differenceInMinutes(item.end, item.start);
    const amount = fmtMoney(item.order.totalAmount, item.order.currency);

    return (
        <Link
            href={ROUTES.project(item.order.projectId, 'orders', item.id)}
            aria-label={`Продажа ${fmtTime(item.start)}, ${amount}`}
            className={cn(
                'absolute z-10 flex flex-col gap-0.5 overflow-hidden rounded-md border border-border border-l-2 border-l-emerald-500 bg-emerald-500/10 px-1.5 py-1 text-left text-[11px] leading-tight select-none',
                selected && 'ring-2 ring-primary z-20',
            )}
            style={{
                top: startMin * pxPerMin,
                height: Math.max(durationMin * pxPerMin, 18),
                left: `calc(${(lane / lanes) * 100}% + 2px)`,
                width: `calc(${100 / lanes}% - 4px)`,
            }}
        >
            <span className="font-mono tabular-nums text-[10px] text-muted-foreground">
                {fmtTime(item.start)}
            </span>
            <span className="font-medium truncate">{saleCardLabel(amount, item.order)}</span>
        </Link>
    );
};
