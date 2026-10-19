'use client';

import { useProject } from '@/app/providers';
import { ROUTES } from '@/shared/constants';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { modal } from '@/shared/lib/modal';
import { useProjectEmployees } from '@/contexts/employeeAssignment';
import { ORDER_STATUS_VALUES, useOrdersList } from '@/contexts/order';
import { Permission } from '@/contexts/user';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { parseAsString, parseAsStringLiteral, useQueryState } from 'nuqs';
import { ALL_SELLERS, sellerFilterOptions, sellerNamesById } from '../lib/sellers';

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

    const [seller, setSeller] = useQueryState('seller', parseAsString.withDefault(ALL_SELLERS));
    const showSeller = can(Permission.VIEW_FINANCES);
    const employeesQuery = useProjectEmployees({ projectId, enabled: showSeller });
    const debouncedSearch = useDebouncedValue(search);
    const employees = employeesQuery.data ?? [];

    const query = useOrdersList({
        projectId,
        statuses: status === 'all' ? undefined : [status],
        sellerId: showSeller && seller !== ALL_SELLERS ? seller : undefined,
        search: debouncedSearch.trim() || undefined,
    });

    const onOpen = (orderId: string) => router.push(ROUTES.project(projectId, 'orders', orderId));

    const canCreateSale = can(Permission.MANAGE_ORDERS);

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
        showSeller,
        seller,
        setSeller,
        sellerOptions: sellerFilterOptions(employees),
        sellerNames: showSeller ? sellerNamesById(employees) : undefined,
        onOpen,
        canCreateSale,
        onCreateSale,
    };
}
