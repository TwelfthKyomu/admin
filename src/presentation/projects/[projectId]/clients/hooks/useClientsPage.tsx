'use client';

import { useProject } from '@/app/providers';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { modal } from '@/shared/lib/modal';
import { type ClientView, useClientsList } from '@/contexts/client';
import { BOOKING_PERMISSIONS, Permission } from '@/contexts/user';
import dynamic from 'next/dynamic';
import { parseAsString, useQueryState } from 'nuqs';

const ClientCreateModal = dynamic(() =>
    import('../modal/ClientCreateModal').then((m) => m.ClientCreateModal),
);

const ClientEditSheet = dynamic(() =>
    import('../modal/ClientEditSheet').then((m) => m.ClientEditSheet),
);

export function useClientsPage() {
    const { projectId, currency, can } = useProject();
    const [search, setSearch] = useQueryState('q', parseAsString.withDefault(''));
    const debouncedSearch = useDebouncedValue(search);
    const query = useClientsList({ projectId, search: debouncedSearch.trim() });
    const canEdit = can(Permission.MANAGE_BOOKINGS);

    const onCreate = () => modal.open(<ClientCreateModal projectId={projectId} />);

    const onEdit = (client: ClientView) =>
        modal.open(
            <ClientEditSheet
                projectId={projectId}
                client={client}
            />,
        );

    return {
        query,
        search,
        setSearch,
        currency,
        canCreate: can(BOOKING_PERMISSIONS),
        onCreate,
        onEdit: canEdit ? onEdit : undefined,
    };
}
