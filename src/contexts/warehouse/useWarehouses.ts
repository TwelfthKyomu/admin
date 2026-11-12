'use client';

import { makeMutation } from '@/shared/lib/mutations';
import { listQuery } from '@/shared/lib/queries';
import { useQuery } from '@tanstack/react-query';
import {
    createWarehouseAction,
    deleteWarehouseAction,
    makePrimaryWarehouseAction,
    updateWarehouseAction,
    warehousesAction,
} from './Warehouse.actions';

const warehouseQueries = {
    all: ['warehouses'] as const,
    list: (projectId: string) =>
        listQuery(
            [...warehouseQueries.all, 'list', projectId],
            () => warehousesAction({ projectId }),
            { enabled: projectId.length > 0 },
        ),
};

export const useWarehousesList = (projectId: string) => {
    return useQuery(warehouseQueries.list(projectId));
};

export const useCreateWarehouse = makeMutation(createWarehouseAction);
export const useUpdateWarehouse = makeMutation(updateWarehouseAction);
export const useDeleteWarehouse = makeMutation(deleteWarehouseAction);
export const useMakePrimaryWarehouse = makeMutation(makePrimaryWarehouseAction);
