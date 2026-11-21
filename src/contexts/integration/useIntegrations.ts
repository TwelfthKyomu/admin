'use client';

import { defineResource } from '@/shared/lib/resource';
import {
    connectStorageAction,
    createIntegrationAction,
    integrationsAction,
    revokeIntegrationAction,
} from './Integration.actions';

const integrations = defineResource({
    key: ['integrations'],
    list: {
        action: integrationsAction,
        input: (projectId: string) => ({ projectId }),
        enabled: (projectId) => projectId.length > 0,
        staleTime: 15_000,
    },
    mutations: {
        useCreateIntegration: createIntegrationAction,
        useRevokeIntegration: revokeIntegrationAction,
        useConnectStorage: connectStorageAction,
    },
});

export const {
    useList: useIntegrationsList,
    mutations: {
        useCreateIntegration,
        useRevokeIntegration,
        useConnectStorage,
    },
} = integrations;
