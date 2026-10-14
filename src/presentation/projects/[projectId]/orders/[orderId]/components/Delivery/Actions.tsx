'use client';

import { CARRIER_STATUS_OPTIONS } from '@/shared/labels/delivery';
import { runAction } from '@/shared/lib/action-result';
import { confirmDestructive } from '@/shared/lib/modal';
import type { Option } from '@/shared/types';
import {
    type CarrierSettableStatus,
    DeliveryKind,
    DeliveryStatus,
    type DeliveryView,
    useAssignDelivery,
    useCancelDelivery,
    useRequeueDelivery,
    useSetCarrierStatus,
} from '@/contexts/delivery';
import { Button, Select } from '@/ui/Base';
import { isCarrierSettable } from '../../lib/delivery';

interface DeliveryActionsProps {
    projectId: string;
    delivery: DeliveryView;
    couriers: Option[];
    onEdit: () => void;
}

export const DeliveryActions = ({
    projectId,
    delivery,
    couriers,
    onEdit,
}: DeliveryActionsProps) => {
    const assign = useAssignDelivery(projectId);
    const requeue = useRequeueDelivery(projectId);
    const cancel = useCancelDelivery(projectId);
    const setCarrierStatus = useSetCarrierStatus(projectId);

    const input = { projectId, id: delivery.id };
    const isCourier = delivery.kind === DeliveryKind.COURIER;

    const canAssign =
        delivery.status === DeliveryStatus.QUEUED || delivery.status === DeliveryStatus.ASSIGNED;

    const canRequeue =
        delivery.status === DeliveryStatus.ASSIGNED || delivery.status === DeliveryStatus.FAILED;

    return (
        <footer className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-3">
            {isCourier && canAssign && (
                <Select<string>
                    options={couriers}
                    value={delivery.courierId ?? undefined}
                    placeholder="Назначить курьера"
                    onValueChange={(courierId) =>
                        runAction(assign.mutateAsync({ ...input, courierId }), {
                            success: 'Курьер назначен',
                        })
                    }
                    triggerClassName="h-8 min-w-44 text-[12px]"
                />
            )}
            {isCourier && canRequeue && (
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={requeue.isPending}
                    onClick={() =>
                        runAction(requeue.mutateAsync(input), {
                            success: 'Доставка вернулась в очередь',
                        })
                    }
                >
                    В очередь
                </Button>
            )}
            {!isCourier && (
                <Select<CarrierSettableStatus>
                    options={CARRIER_STATUS_OPTIONS}
                    value={isCarrierSettable(delivery.status) ? delivery.status : undefined}
                    onValueChange={(status) =>
                        runAction(setCarrierStatus.mutateAsync({ ...input, status }))
                    }
                    triggerClassName="h-8 text-[12px]"
                />
            )}
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onEdit}
            >
                Изменить
            </Button>
            <Button
                type="button"
                variant="ghost"
                size="sm"
                className="ml-auto text-destructive"
                onClick={() =>
                    confirmDestructive({
                        title: 'Отменить доставку?',
                        description: 'Курьер или служба больше не увидят этот заказ в работе.',
                        confirmLabel: 'Отменить доставку',
                        success: 'Доставка отменена',
                        onConfirm: () => cancel.mutateAsync(input),
                    })
                }
            >
                Отменить
            </Button>
        </footer>
    );
};
