'use client';

import { defineResource } from '@/shared/lib/resource';
import {
    createWarehouseAction,
    deleteWarehouseAction,
    makePrimaryWarehouseAction,
    updateWarehouseAction,
    warehousesAction,
} from './Warehouse.actions';

const warehouses = defineResource({
    key: ['warehouses'],
    list: {
        action: warehousesAction,
        input: (projectId: string) => ({ projectId }),
        enabled: (projectId) => projectId.length > 0,
    },
    mutations: {
        useCreateWarehouse: createWarehouseAction,
        useUpdateWarehouse: updateWarehouseAction,
        useDeleteWarehouse: deleteWarehouseAction,
        useMakePrimaryWarehouse: makePrimaryWarehouseAction,
    },
});

export const {
    useList: useWarehousesList,
    mutations: {
        useCreateWarehouse,
        useUpdateWarehouse,
        useDeleteWarehouse,
        useMakePrimaryWarehouse,
    },
} = warehouses;
