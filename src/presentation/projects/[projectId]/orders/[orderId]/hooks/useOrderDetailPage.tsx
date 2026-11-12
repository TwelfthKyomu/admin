'use client';

import { useProject } from '@/app/providers';
import { modal } from '@/shared/lib/modal';
import { isOpenDelivery, useOrderDelivery } from '@/contexts/delivery';
import { useProjectEmployees } from '@/contexts/employeeAssignment';
import { type OrderItemView, type OrderView, useOrderDetail } from '@/contexts/order';
import { useOrderStock } from '@/contexts/stockMovement';
import { Permission } from '@/contexts/user';
import { useWarehousesList, warehouseNamesById } from '@/contexts/warehouse';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { sellerLabel, sellerNamesById, sellerOptions } from '../../lib/sellers';
import { itemStockLabel } from '../lib/itemStock';

const OrderSellerEditSheet = dynamic(() =>
    import('../modal/OrderSellerEditSheet').then((m) => m.OrderSellerEditSheet),
);

export const useOrderDetailPage = () => {
    const { projectId, can } = useProject();
    const { orderId } = useParams<{ orderId: string }>();
    const query = useOrderDetail({ id: orderId, projectId });
    const delivery = useOrderDelivery(projectId, orderId).data;
    const stockLines = useOrderStock(projectId, orderId).data ?? [];
    const warehouseNames = warehouseNamesById(useWarehousesList(projectId).data ?? []);
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
        hasOpenDelivery: delivery ? isOpenDelivery(delivery.status) : false,
        sellerName: (order: OrderView) => sellerLabel(order.sellerId, sellerNames),
        itemStock: (item: OrderItemView) => itemStockLabel(item, stockLines, warehouseNames),
        onChangeSeller: canChangeSeller ? onChangeSeller : undefined,
    };
};
