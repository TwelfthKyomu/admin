'use client';

import { defineResource } from '@/shared/lib/resource';
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

const clients = defineResource({
    key: ['clients'],
    list: {
        action: clientsAction,
        input: ({ projectId, search, limit }: ListOptions) => ({
            projectId,
            search: search || undefined,
            limit,
        }),
        enabled: ({ projectId, enabled = true }: ListOptions) =>
            enabled && projectId.length > 0,
    },
    mutations: {
        useCreateClient: createClientAction,
        useUpdateClient: updateClientAction,
    },
});

export const {
    useList: useClientsList,
    mutations: { useCreateClient, useUpdateClient },
} = clients;
