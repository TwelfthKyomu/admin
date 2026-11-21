'use client';

import { defineResource } from '@/shared/lib/resource';
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

const categories = defineResource({
    key: ['categories'],
    list: {
        action: categoriesAction,
        input: ({ projectId, includeInactive }: ListOptions) => ({
            projectId,
            includeInactive,
        }),
        enabled: ({ projectId, enabled = true }: ListOptions) =>
            enabled && projectId.length > 0,
    },
    mutations: {
        useCreateCategory: createCategoryAction,
        useUpdateCategory: updateCategoryAction,
        useDeleteCategory: deleteCategoryAction,
    },
});

export const {
    useList: useCategoriesList,
    mutations: { useCreateCategory, useUpdateCategory, useDeleteCategory },
} = categories;
