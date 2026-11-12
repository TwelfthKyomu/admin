'use client';

import { makeMutation } from '@/shared/lib/mutations';
import { listQuery } from '@/shared/lib/queries';
import { useQuery } from '@tanstack/react-query';
import {
    createLookAction,
    deleteLookAction,
    looksAction,
    updateLookAction,
} from './Look.actions';

const lookQueries = {
    all: ['looks'] as const,
    list: (projectId: string) =>
        listQuery(
            [...lookQueries.all, 'list', projectId],
            () => looksAction({ projectId }),
            { enabled: projectId.length > 0 },
        ),
};

export const useLooksList = (projectId: string) => {
    return useQuery(lookQueries.list(projectId));
};

export const useCreateLook = makeMutation(createLookAction);
export const useUpdateLook = makeMutation(updateLookAction);
export const useDeleteLook = makeMutation(deleteLookAction);
