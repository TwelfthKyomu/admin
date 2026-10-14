'use client';

import { makeScopedMutation } from '@/shared/lib/mutations';
import { listQuery } from '@/shared/lib/queries';
import { useQuery } from '@tanstack/react-query';
import {
    categoriesAction,
    createCategoryAction,
    deleteCategoryAction,
    updateCategoryAction,
} from './ProjectCategory.actions';

interface ListOptions {
    projectId: string;
    includeInactive?: boolean;
    enabled?: boolean;
}

const categoryQueries = {
    all: ['categories'] as const,
    list: ({
        projectId,
        includeInactive = false,
        enabled = true,
    }: ListOptions) =>
        listQuery(
            [...categoryQueries.all, 'list', projectId, includeInactive],
            () => categoriesAction({ projectId, includeInactive }),
            { enabled: enabled && projectId.length > 0 },
        ),
};

export function useCategoriesList(opts: ListOptions) {
    return useQuery(categoryQueries.list(opts));
}

export const useCreateCategory = makeScopedMutation(createCategoryAction);
export const useUpdateCategory = makeScopedMutation(updateCategoryAction);
export const useDeleteCategory = makeScopedMutation(deleteCategoryAction);
