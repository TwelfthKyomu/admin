'use client';

import { makeMutation } from '@/shared/lib/mutations';
import { listQuery } from '@/shared/lib/queries';
import { useQuery } from '@tanstack/react-query';
import {
    orderStockAction,
    stockMovementsAction,
    stockOverviewAction,
} from './StockMovement.actions';
import {
    countStockAction,
    receiveStockAction,
    transferStockAction,
    writeOffStockAction,
} from './StockOperation.actions';

interface MovementsOptions {
    projectId: string;
    productId?: string;
}

const stockQueries = {
    all: ['stock'] as const,
    overview: (projectId: string) =>
        listQuery(
            [...stockQueries.all, 'overview', projectId],
            () => stockOverviewAction({ projectId }),
            { enabled: projectId.length > 0, staleTime: 15_000 },
        ),
    movements: ({ projectId, productId }: MovementsOptions) =>
        listQuery(
            [...stockQueries.all, 'movements', projectId, productId ?? ''],
            () => stockMovementsAction({ projectId, productId }),
            { enabled: projectId.length > 0, staleTime: 15_000 },
        ),
    order: (projectId: string, orderId: string) =>
        listQuery(
            [...stockQueries.all, 'order', projectId, orderId],
            () => orderStockAction({ projectId, orderId }),
            { enabled: orderId.length > 0 },
        ),
};

export const useOrderStock = (projectId: string, orderId: string) => {
    return useQuery(stockQueries.order(projectId, orderId));
};

export const useStockOverview = (projectId: string) => {
    return useQuery(stockQueries.overview(projectId));
};

export const useStockMovements = (opts: MovementsOptions) => {
    return useQuery(stockQueries.movements(opts));
};

export const useReceiveStock = makeMutation(receiveStockAction);
export const useWriteOffStock = makeMutation(writeOffStockAction);
export const useCountStock = makeMutation(countStockAction);
export const useTransferStock = makeMutation(transferStockAction);
