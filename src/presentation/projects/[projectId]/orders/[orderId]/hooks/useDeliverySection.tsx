'use client';

import { useProject } from '@/app/providers';
import { modal } from '@/shared/lib/modal';
import { type DeliveryView, useOrderDelivery } from '@/contexts/delivery';
import { EmployeeKind, useProjectEmployees } from '@/contexts/employeeAssignment';
import type { OrderView } from '@/contexts/order';
import { Permission } from '@/contexts/user';
import { employeeOptions } from '../../../schedule/lib/employees';
import { DeliveryModal } from '../modal/DeliveryModal';

export const useDeliverySection = (order: OrderView, projectId: string) => {
    const { can } = useProject();
    const canManage = can(Permission.MANAGE_DELIVERIES);
    const delivery = useOrderDelivery(projectId, order.id).data ?? undefined;
    const employees = useProjectEmployees({ projectId, enabled: canManage }).data ?? [];

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

    return { canManage, delivery, couriers, openModal };
};
