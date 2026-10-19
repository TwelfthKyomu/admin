'use client';

import { useProject } from '@/app/providers';
import { DELIVERY_STATUS_VARIANT, deliveryStatusLabel } from '@/shared/labels/delivery';
import { modal } from '@/shared/lib/modal';
import { type DeliveryView, isOpenDelivery, useOrderDelivery } from '@/contexts/delivery';
import { EmployeeKind, useProjectEmployees } from '@/contexts/employeeAssignment';
import type { OrderView } from '@/contexts/order';
import { Permission } from '@/contexts/user';
import { DeliveryModal } from '@/presentation/projects/[projectId]/orders/[orderId]/modal/DeliveryModal';
import { employeeOptions } from '@/presentation/projects/[projectId]/schedule/lib/employees';
import { Badge, Button } from '@/ui/Base';
import { Section } from '../Section';
import { DeliveryActions } from './Actions';
import { DeliveryDetails } from './Details';

interface DeliverySectionProps {
    order: OrderView;
    projectId: string;
}

export const DeliverySection = ({ order, projectId }: DeliverySectionProps) => {
    const { can } = useProject();
    const canManage = can(Permission.MANAGE_DELIVERIES);
    const delivery = useOrderDelivery(projectId, order.id).data ?? undefined;
    const employees = useProjectEmployees({ projectId, enabled: canManage }).data ?? [];

    if (!delivery && !canManage) return null;

    const couriers = employeeOptions(
        employees.filter((employee) => employee.kind === EmployeeKind.COURIER),
    );

    const openModal = (initial?: DeliveryView) =>
        modal.open(
            <DeliveryModal
                projectId={projectId}
                order={order}
                initial={initial}
                couriers={couriers}
            />,
        );

    return (
        <Section
            title="Доставка"
            aside={
                delivery && (
                    <Badge variant={DELIVERY_STATUS_VARIANT[delivery.status]}>
                        {deliveryStatusLabel(delivery.kind, delivery.status)}
                    </Badge>
                )
            }
        >
            {!delivery && (
                <div className="flex items-center justify-between gap-3 px-4 py-4 text-[13px]">
                    <span className="text-muted-foreground">Доставки нет.</span>
                    <Button
                        type="button"
                        size="sm"
                        onClick={() => openModal()}
                    >
                        Добавить доставку
                    </Button>
                </div>
            )}
            {delivery && <DeliveryDetails delivery={delivery} />}
            {delivery && canManage && isOpenDelivery(delivery.status) && (
                <DeliveryActions
                    projectId={projectId}
                    delivery={delivery}
                    couriers={couriers}
                    onEdit={() => openModal(delivery)}
                />
            )}
        </Section>
    );
};
