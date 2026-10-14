'use client';

import { makeScopedMutation } from '@/shared/lib/mutations';
import { listQuery } from '@/shared/lib/queries';
import { useQuery } from '@tanstack/react-query';
import {
    createProductAction,
    deleteProductAction,
    productsAction,
    updateProductAction,
} from './Product.actions';

interface ListOptions {
    projectId: string;
    search?: string;
    enabled?: boolean;
}

const productQueries = {
    all: ['products'] as const,
    list: ({ projectId, search = '', enabled = true }: ListOptions) =>
        listQuery(
            [...productQueries.all, 'list', projectId, search],
            () => productsAction({ projectId, search: search || undefined }),
            { enabled: enabled && projectId.length > 0 },
        ),
};

export function useProductsList(opts: ListOptions) {
    return useQuery(productQueries.list(opts));
}

export const useCreateProduct = makeScopedMutation(createProductAction);
export const useUpdateProduct = makeScopedMutation(updateProductAction);
export const useDeleteProduct = makeScopedMutation(deleteProductAction);
