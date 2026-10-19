'use client';

import { useProject } from '@/app/providers';
import { useOrderDetail } from '@/contexts/order';
import { ORDER_PERMISSIONS, Permission } from '@/contexts/user';
import { useParams } from 'next/navigation';

export function useOrderDetailPage() {
    const { projectId, can } = useProject();
    const { orderId } = useParams<{ orderId: string }>();
    const query = useOrderDetail({ id: orderId, projectId });

    return {
        query,
        projectId,
        canEdit: can(ORDER_PERMISSIONS),
        canFinance: can(Permission.VIEW_FINANCES),
        canManageFinance: can(Permission.MANAGE_FINANCES),
    };
}
