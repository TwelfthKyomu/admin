'use client';

import { makeMutation } from '@/shared/lib/mutations';
import { listQuery } from '@/shared/lib/queries';
import { useQuery } from '@tanstack/react-query';
import {
    connectStorageAction,
    createIntegrationAction,
    integrationsAction,
    revokeIntegrationAction,
} from './Integration.actions';

const integrationQueries = {
    all: ['integrations'] as const,
    list: (projectId: string) =>
        listQuery(
            [...integrationQueries.all, 'list', projectId],
            () => integrationsAction({ projectId }),
            { enabled: projectId.length > 0, staleTime: 15_000 },
        ),
};

export function useIntegrationsList(projectId: string) {
    return useQuery(integrationQueries.list(projectId));
}

export const useCreateIntegration = makeMutation(createIntegrationAction);
export const useRevokeIntegration = makeMutation(revokeIntegrationAction);
export const useConnectStorage = makeMutation(connectStorageAction);
