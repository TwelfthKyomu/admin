'use client';

import { clientDisplayName, clientLabel } from '@/shared/format/name';
import { NONE } from '@/shared/lib/none';
import { useClientsList } from '@/contexts/client';

type SetCustomerField = (
    name: 'customerName' | 'customerPhone',
    value: string,
    options?: { shouldValidate?: boolean },
) => void;

export function useClientPicker(projectId: string, setValue: SetCustomerField) {
    const clients = useClientsList({ projectId }).data ?? [];

    const clientOptions = [
        { value: NONE, label: 'Без аккаунта (ввести вручную)' },
        ...clients.map((client) => ({
            value: client.id,
            label: clientLabel(client),
            keywords: [client.email ?? '', client.phone ?? ''],
        })),
    ];

    const onClientChange = (clientId: string) => {
        const client = clients.find((candidate) => candidate.id === clientId);

        setValue('customerName', client ? clientDisplayName(client) : '', {
            shouldValidate: true,
        });

        setValue('customerPhone', client?.phone ?? '');
    };

    return { clientOptions, onClientChange };
}
