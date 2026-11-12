'use client';

import {
    useCountStock,
    useReceiveStock,
    useWriteOffStock,
} from '@/contexts/stockMovement';
import { StockOperationType } from '../lib/stockOperation';

export const useStockOperation = (type: StockOperationType) => {
    const receive = useReceiveStock();
    const writeOff = useWriteOffStock();
    const count = useCountStock();

    const byType = {
        [StockOperationType.RECEIPT]: receive,
        [StockOperationType.WRITE_OFF]: writeOff,
        [StockOperationType.COUNT]: count,
    };

    return byType[type];
};
