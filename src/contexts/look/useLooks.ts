'use client';

import { defineResource } from '@/shared/lib/resource';
import {
    createLookAction,
    deleteLookAction,
    looksAction,
    updateLookAction,
} from './Look.actions';

const looks = defineResource({
    key: ['looks'],
    list: {
        action: looksAction,
        input: (projectId: string) => ({ projectId }),
        enabled: (projectId) => projectId.length > 0,
    },
    mutations: {
        useCreateLook: createLookAction,
        useUpdateLook: updateLookAction,
        useDeleteLook: deleteLookAction,
    },
});

export const {
    useList: useLooksList,
    mutations: { useCreateLook, useUpdateLook, useDeleteLook },
} = looks;
