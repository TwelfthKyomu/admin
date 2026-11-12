'use client';

import { makeMutation } from '@/shared/lib/mutations';
import { listQuery } from '@/shared/lib/queries';
import { useQuery } from '@tanstack/react-query';
import {
    clientsAction,
    createClientAction,
    updateClientAction,
} from './Client.actions';

interface ListOptions {
    projectId: string;
    search?: string;
    limit?: number;
    enabled?: boolean;
}

const clientQueries = {
    all: ['clients'] as const,
    list: ({ projectId, search = '', limit, enabled = true }: ListOptions) =>
        listQuery(
            [...clientQueries.all, 'list', projectId, search, limit],
            () =>
                clientsAction({
                    projectId,
                    search: search || undefined,
                    limit,
                }),
            { enabled: enabled && projectId.length > 0 },
        ),
};

export const useClientsList = (opts: ListOptions) => {
    return useQuery(clientQueries.list(opts));
};

export const useCreateClient = makeMutation(createClientAction);
export const useUpdateClient = makeMutation(updateClientAction);
