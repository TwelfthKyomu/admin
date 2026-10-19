'use client';

import { useProject } from '@/app/providers';
import { modal } from '@/shared/lib/modal';
import { useProjectEmployees } from '@/contexts/employeeAssignment';
import { type OrderView, useOrderDetail } from '@/contexts/order';
import { Permission } from '@/contexts/user';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { sellerLabel, sellerNamesById, sellerOptions } from '../../lib/sellers';

const OrderSellerEditSheet = dynamic(() =>
    import('../modal/OrderSellerEditSheet').then((m) => m.OrderSellerEditSheet),
);

export function useOrderDetailPage() {
    const { projectId, can } = useProject();
    const { orderId } = useParams<{ orderId: string }>();
    const query = useOrderDetail({ id: orderId, projectId });
    const canSeeSeller = can(Permission.VIEW_FINANCES);
    const employeesQuery = useProjectEmployees({ projectId, enabled: canSeeSeller });

    const employees = employeesQuery.data ?? [];
    const sellerNames = sellerNamesById(employees);
    const canChangeSeller = can(Permission.MANAGE_MEMBERS);

    const onChangeSeller = (order: OrderView) =>
        modal.open(
            <OrderSellerEditSheet
                projectId={projectId}
                order={order}
                options={sellerOptions(employees)}
            />,
        );

    return {
        query,
        projectId,
        canEdit: can(Permission.MANAGE_ORDERS),
        canFinance: can(Permission.VIEW_FINANCES),
        canManageFinance: can(Permission.MANAGE_FINANCES),
        canSeeSeller,
        sellerName: (order: OrderView) => sellerLabel(order.sellerId, sellerNames),
        onChangeSeller: canChangeSeller ? onChangeSeller : undefined,
    };
}
