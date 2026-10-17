'use client';

import {
    ORDER_STATUS_ACTION_LABEL,
    ORDER_STATUS_ACTION_TONE,
    ORDER_STATUS_LABEL,
    ORDER_STATUS_VARIANT,
    PAYMENT_STATUS_LABEL,
    PAYMENT_STATUS_VARIANT,
} from '@/shared/labels/order';
import { runAction } from '@/shared/lib/action-result';
import { confirmDestructive } from '@/shared/lib/modal';
import {
    getNextOrderStatuses,
    OrderStatus,
    type OrderView,
    useChangeOrderStatus,
} from '@/contexts/order';
import { Badge, Button } from '@/ui/Base';
import { Section } from './Section';

interface StatusSectionProps {
    order: OrderView;
    projectId: string;
    canEdit: boolean;
}

export const StatusSection = ({ order, projectId, canEdit }: StatusSectionProps) => {
    const { mutateAsync, isPending } = useChangeOrderStatus(projectId);
    const next = getNextOrderStatuses(order.status);

    const onTransition = (status: OrderStatus) => {
        const input = { id: order.id, projectId, nextStatus: status };
        const success = `Статус: ${ORDER_STATUS_LABEL[status]}`;
        const isCancel = status === OrderStatus.CANCELLED;

        if (isCancel || status === OrderStatus.NO_SHOW) {
            return confirmDestructive({
                title: isCancel ? 'Отменить заказ?' : 'Отметить «не пришёл»?',
                description: 'Вернуть прежний статус будет нельзя.',
                confirmLabel: isCancel ? 'Отменить' : 'Не пришёл',
                success,
                onConfirm: () => mutateAsync(input),
            });
        }

        return runAction(mutateAsync(input), { success });
    };

    return (
        <Section
            title="Статус"
            aside={
                <div className="flex gap-2">
                    <Badge variant={ORDER_STATUS_VARIANT[order.status]}>
                        {ORDER_STATUS_LABEL[order.status]}
                    </Badge>
                    <Badge variant={PAYMENT_STATUS_VARIANT[order.paymentStatus]}>
                        {PAYMENT_STATUS_LABEL[order.paymentStatus]}
                    </Badge>
                </div>
            }
        >
            {canEdit && (
                <div className="flex flex-wrap gap-2 px-4 py-3">
                    {next.length === 0 && (
                        <p className="text-[12px] text-muted-foreground">
                            Заказ закрыт — статус больше не меняется.
                        </p>
                    )}
                    {next.map((status) => (
                        <Button
                            key={status}
                            size="sm"
                            variant={
                                ORDER_STATUS_ACTION_TONE[status] === 'destructive'
                                    ? 'outline'
                                    : 'default'
                            }
                            disabled={isPending}
                            onClick={() => onTransition(status)}
                        >
                            {ORDER_STATUS_ACTION_LABEL[status]}
                        </Button>
                    ))}
                </div>
            )}
        </Section>
    );
};
