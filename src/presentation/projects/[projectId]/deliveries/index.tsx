'use client';

import { useProject } from '@/app/providers';
import { Permission } from '@/contexts/user';
import { CourierPanel } from './components/CourierPanel';
import { DispatcherPanel } from './components/DispatcherPanel';

export const DeliveriesPage = () => {
    const { can } = useProject();

    return can([Permission.MANAGE_DELIVERIES, Permission.VIEW_DELIVERIES]) ? (
        <DispatcherPanel />
    ) : (
        <CourierPanel />
    );
};
