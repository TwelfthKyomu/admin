import { PersonCell } from '@/shared/components/common';
import { ROUTES } from '@/shared/constants';
import { cn } from '@/shared/lib/utils';
import { DeliveryStatus, type DeliveryView } from '@/contexts/delivery';
import { Button } from '@/ui/Base';
import { Select } from '@/ui/Base/Select';
import Link from 'next/link';
import { deliveryWindowLabel, isLateDelivery } from '../lib/deliveries';
import { PayBadge } from './PayBadge';

interface DeliveryCardProps {
    projectId: string;
    delivery: DeliveryView;
    courierOptions: ReadonlyArray<{ value: string; label: string }>;
    canManage: boolean;
    onAssign: (delivery: DeliveryView, courierId: string) => void;
    onRequeue: (delivery: DeliveryView) => void;
    onCancel: (delivery: DeliveryView) => void;
}

export const DeliveryCard = ({
    projectId,
    delivery,
    courierOptions,
    canManage,
    onAssign,
    onRequeue,
    onCancel,
}: DeliveryCardProps) => {
    const late = isLateDelivery(delivery);
    const failed = delivery.status === DeliveryStatus.FAILED;

    return (
        <article
            className={cn(
                'grid gap-2 rounded-lg border border-border bg-background p-3 text-[13px]',
                (late || failed) && 'border-destructive/40',
            )}
        >
            <div className="flex items-center justify-between gap-2">
                <Link
                    href={ROUTES.project(projectId, 'orders', delivery.orderId)}
                    className="truncate font-medium hover:underline"
                >
                    {delivery.customerName ?? 'Заказ'}
                </Link>
                <span
                    className={cn(
                        'shrink-0 tabular-nums',
                        late ? 'font-medium text-destructive' : 'text-muted-foreground',
                    )}
                >
                    {deliveryWindowLabel(delivery)}
                </span>
            </div>
            <span>{delivery.address ?? 'Адрес не указан'}</span>
            {(delivery.recipientName || delivery.recipientPhone) && (
                <span className="text-[12px] text-muted-foreground">
                    {[delivery.recipientName, delivery.recipientPhone].filter(Boolean).join(' · ')}
                </span>
            )}
            <div className="flex items-center justify-between gap-2">
                <PayBadge delivery={delivery} />
                {delivery.courierName && <PersonCell name={delivery.courierName} />}
            </div>

            {failed && delivery.failureReason && (
                <span className="text-[12px] font-medium text-destructive">
                    Не доставлено: {delivery.failureReason}
                </span>
            )}

            {canManage && delivery.status === DeliveryStatus.QUEUED && (
                <Select<string>
                    options={courierOptions}
                    placeholder="Назначить курьера"
                    onValueChange={(courierId) => onAssign(delivery, courierId)}
                    triggerClassName="h-8 w-full text-[12px]"
                />
            )}
            {canManage && failed && (
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onRequeue(delivery)}
                    >
                        В очередь
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => onCancel(delivery)}
                    >
                        Отменить доставку
                    </Button>
                </div>
            )}
        </article>
    );
};
