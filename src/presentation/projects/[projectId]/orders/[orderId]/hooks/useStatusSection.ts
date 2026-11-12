'use client';

import { ORDER_STATUS_LABEL } from '@/shared/labels/order';
import { runAction } from '@/shared/lib/action-result';
import { confirmDestructive } from '@/shared/lib/modal';
import {
    getNextOrderStatuses,
    OrderStatus,
    type OrderView,
    useChangeOrderStatus,
} from '@/contexts/order';

export const useStatusSection = ({
    order,
    projectId,
    hasDelivery,
}: {
    order: OrderView;
    projectId: string;
    hasDelivery: boolean;
}) => {
    const { mutateAsync, isPending } = useChangeOrderStatus();
    const next = getNextOrderStatuses(order.status, { hasDelivery });

    const onTransition = (status: OrderStatus) => {
        const input = { id: order.id, projectId, nextStatus: status };
        const success = `Статус: ${ORDER_STATUS_LABEL[status]}`;
        const isCancel = status === OrderStatus.CANCELLED;

        if (isCancel) {
            return confirmDestructive({
                title: 'Отменить заказ?',
                description: 'Вернуть прежний статус будет нельзя.',
                confirmLabel: 'Отменить',
                success,
                onConfirm: () => mutateAsync(input),
            });
        }

        return runAction(mutateAsync(input), { success });
    };

    return { isPending, next, onTransition };
};
