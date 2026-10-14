'use client';

import { makeScopedMutation } from '@/shared/lib/mutations';
import { listQuery } from '@/shared/lib/queries';
import { useQuery } from '@tanstack/react-query';
import {
    adjustStockAction,
    stockMovementsAction,
    stockOverviewAction,
} from './StockMovement.actions';

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
};

export function useStockOverview(projectId: string) {
    return useQuery(stockQueries.overview(projectId));
}

export function useStockMovements(opts: MovementsOptions) {
    return useQuery(stockQueries.movements(opts));
}

export const useAdjustStock = makeScopedMutation(adjustStockAction);
