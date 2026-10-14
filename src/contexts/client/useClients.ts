'use client';

import { makeScopedMutation } from '@/shared/lib/mutations';
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
    enabled?: boolean;
}

const clientQueries = {
    all: ['clients'] as const,
    list: ({ projectId, search = '', enabled = true }: ListOptions) =>
        listQuery(
            [...clientQueries.all, 'list', projectId, search],
            () => clientsAction({ projectId, search: search || undefined }),
            { enabled: enabled && projectId.length > 0 },
        ),
};

export function useClientsList(opts: ListOptions) {
    return useQuery(clientQueries.list(opts));
}

export const useCreateClient = makeScopedMutation(createClientAction);
export const useUpdateClient = makeScopedMutation(updateClientAction);
