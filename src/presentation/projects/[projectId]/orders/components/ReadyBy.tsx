import { fmtDateTime } from '@/shared/format/date';
import { isReadyOverdue, type OrderView } from '@/contexts/order';
import { Badge } from '@/ui/Base';

interface ReadyByProps {
    order: Pick<OrderView, 'readyBy' | 'status'>;
}

export const ReadyBy = ({ order }: ReadyByProps) => {
    if (!order.readyBy) return <span className="text-muted-foreground">—</span>;

    return (
        <span className="inline-flex items-center gap-1.5 tabular-nums">
            {fmtDateTime(order.readyBy)}
            {isReadyOverdue(order, new Date()) && <Badge variant="destructive">Просрочен</Badge>}
        </span>
    );
};
