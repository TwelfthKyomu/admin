import { fmtMoney } from '@/shared/format/money';
import { DELIVERY_STATUS_VARIANT, deliveryStatusLabel } from '@/shared/labels/delivery';
import { DeliveryStatus, type DeliveryView } from '@/contexts/delivery';
import { Badge, Button } from '@/ui/Base';
import { deliveryWindowLabel } from '../lib/deliveries';

interface CurrentDeliveryCardProps {
    delivery: DeliveryView;
    isBusy: boolean;
    onPickUp: (delivery: DeliveryView) => void;
    onDelivered: (delivery: DeliveryView) => void;
    onFailed: (delivery: DeliveryView) => void;
}

export const CurrentDeliveryCard = ({
    delivery,
    isBusy,
    onPickUp,
    onDelivered,
    onFailed,
}: CurrentDeliveryCardProps) => (
    <article className="grid gap-2.5 rounded-2xl border border-foreground p-4">
        <div className="flex items-center justify-between">
            <Badge variant={DELIVERY_STATUS_VARIANT[delivery.status]}>
                {deliveryStatusLabel(delivery.kind, delivery.status)}
            </Badge>
            <span className="text-[13px] font-semibold tabular-nums">
                {deliveryWindowLabel(delivery)}
            </span>
        </div>
        <span className="text-lg leading-snug font-semibold">
            {delivery.address ?? 'Адрес не указан'}
        </span>
        {(delivery.recipientName || delivery.recipientPhone) && (
            <div className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2.5 text-[13px]">
                <span>{delivery.recipientName ?? 'Получатель'}</span>
                {delivery.recipientPhone && (
                    <a
                        href={`tel:${delivery.recipientPhone}`}
                        className="font-medium text-primary"
                    >
                        Позвонить
                    </a>
                )}
            </div>
        )}
        <div className="flex items-baseline justify-between">
            <span className="text-[13px] text-muted-foreground">Взять у двери</span>
            <span className="text-xl font-semibold tabular-nums">
                {fmtMoney(delivery.cashDue, delivery.currency)}
            </span>
        </div>
        {delivery.status === DeliveryStatus.ASSIGNED ? (
            <Button
                size="lg"
                className="h-11"
                disabled={isBusy}
                onClick={() => onPickUp(delivery)}
            >
                Забрал заказ
            </Button>
        ) : (
            <Button
                size="lg"
                className="h-11"
                disabled={isBusy}
                onClick={() => onDelivered(delivery)}
            >
                {delivery.cashDue > 0
                    ? `Доставлено — принять ${fmtMoney(delivery.cashDue, delivery.currency)}`
                    : 'Доставлено'}
            </Button>
        )}
        <Button
            size="lg"
            variant="outline"
            className="h-11"
            onClick={() => onFailed(delivery)}
        >
            Не доставлено
        </Button>
    </article>
);
