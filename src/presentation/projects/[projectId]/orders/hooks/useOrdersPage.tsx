'use client';

import { useProject } from '@/app/providers';
import { ROUTES } from '@/shared/constants';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { modal } from '@/shared/lib/modal';
import { ORDER_STATUS_VALUES, useOrdersList } from '@/contexts/order';
import { Permission } from '@/contexts/user';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { parseAsString, parseAsStringLiteral, useQueryState } from 'nuqs';

const SaleCreateModal = dynamic(() =>
    import('../modal/SaleCreateModal').then((m) => m.SaleCreateModal),
);

const STATUS_FILTER_VALUES = ['all', ...ORDER_STATUS_VALUES] as const;

export function useOrdersPage() {
    const { projectId, currency, can } = useProject();
    const router = useRouter();
    const [search, setSearch] = useQueryState('q', parseAsString.withDefault(''));

    const [status, setStatus] = useQueryState(
        'status',
        parseAsStringLiteral(STATUS_FILTER_VALUES).withDefault('all'),
    );

    const debouncedSearch = useDebouncedValue(search);

    const query = useOrdersList({
        projectId,
        statuses: status === 'all' ? undefined : [status],
        search: debouncedSearch.trim() || undefined,
    });

    const onOpen = (orderId: string) => router.push(ROUTES.project(projectId, 'orders', orderId));

    const canCreateSale = can(Permission.MANAGE_BOOKINGS);

    const onCreateSale = () =>
        modal.open(
            <SaleCreateModal
                projectId={projectId}
                currency={currency}
            />,
        );

    return {
        query,
        search,
        setSearch,
        status,
        setStatus,
        onOpen,
        canCreateSale,
        onCreateSale,
    };
}
