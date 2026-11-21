'use client';

import { defineResource } from '@/shared/lib/resource';
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

const stockOverview = defineResource({
    key: ['stock', 'overview'],
    list: {
        action: stockOverviewAction,
        input: (projectId: string) => ({ projectId }),
        enabled: (projectId) => projectId.length > 0,
        staleTime: 15_000,
    },
    mutations: {
        useReceiveStock: receiveStockAction,
        useWriteOffStock: writeOffStockAction,
        useCountStock: countStockAction,
        useTransferStock: transferStockAction,
    },
});

const stockMovements = defineResource({
    key: ['stock', 'movements'],
    list: {
        action: stockMovementsAction,
        input: ({ projectId, productId }: MovementsOptions) => ({
            projectId,
            productId,
        }),
        enabled: ({ projectId }: MovementsOptions) => projectId.length > 0,
        staleTime: 15_000,
    },
});

const orderStock = defineResource({
    key: ['stock', 'order'],
    list: {
        action: orderStockAction,
        input: (projectId: string, orderId: string) => ({
            projectId,
            orderId,
        }),
        enabled: (_projectId: string, orderId: string) => orderId.length > 0,
    },
});

export const { useList: useStockOverview } = stockOverview;
export const { useList: useStockMovements } = stockMovements;
export const { useList: useOrderStock } = orderStock;

export const {
    mutations: {
        useReceiveStock,
        useWriteOffStock,
        useCountStock,
        useTransferStock,
    },
} = stockOverview;
