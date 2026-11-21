'use client';

import { defineResource } from '@/shared/lib/resource';
import {
    createProductAction,
    deleteProductAction,
    productsAction,
    updateProductAction,
} from './Product.actions';
import { importProductsAction } from './ProductImport.actions';

interface ListOptions {
    projectId: string;
    search?: string;
    enabled?: boolean;
}

const products = defineResource({
    key: ['products'],
    list: {
        action: productsAction,
        input: ({ projectId, search }: ListOptions) => ({
            projectId,
            search: search || undefined,
        }),
        enabled: ({ projectId, enabled = true }: ListOptions) =>
            enabled && projectId.length > 0,
    },
    mutations: {
        useCreateProduct: createProductAction,
        useUpdateProduct: updateProductAction,
        useDeleteProduct: deleteProductAction,
        useImportProducts: importProductsAction,
    },
});

export const {
    useList: useProductsList,
    mutations: {
        useCreateProduct,
        useUpdateProduct,
        useDeleteProduct,
        useImportProducts,
    },
} = products;
