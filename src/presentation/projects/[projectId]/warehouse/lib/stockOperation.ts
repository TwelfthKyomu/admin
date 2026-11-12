import type { Option } from '@/shared/types';
import {
    CountStockActionInputSchema,
    ReceiveStockActionInputSchema,
    StockOperationActionInputSchema,
} from '@/contexts/stockMovement';
import type { WarehouseView } from '@/contexts/warehouse';

export const StockOperationType = {
    RECEIPT: 'receipt',
    WRITE_OFF: 'writeOff',
    COUNT: 'count',
} as const;

export type StockOperationType =
    (typeof StockOperationType)[keyof typeof StockOperationType];

interface StockOperationText {
    title: string;
    quantityLabel: string;
    submitLabel: string;
    success: string;
}

export const STOCK_OPERATION_TEXT: Record<
    StockOperationType,
    StockOperationText
> = {
    [StockOperationType.RECEIPT]: {
        title: 'Приёмка',
        quantityLabel: 'Сколько пришло',
        submitLabel: 'Принять',
        success: 'Товар принят на склад',
    },
    [StockOperationType.WRITE_OFF]: {
        title: 'Списание',
        quantityLabel: 'Сколько списать',
        submitLabel: 'Списать',
        success: 'Товар списан',
    },
    [StockOperationType.COUNT]: {
        title: 'Пересчёт',
        quantityLabel: 'Фактически на складе',
        submitLabel: 'Сохранить',
        success: 'Остаток пересчитан',
    },
};

export const STOCK_OPERATION_SCHEMA = {
    [StockOperationType.RECEIPT]: ReceiveStockActionInputSchema,
    [StockOperationType.WRITE_OFF]: StockOperationActionInputSchema,
    [StockOperationType.COUNT]: CountStockActionInputSchema,
};

export const warehouseOptions = (warehouses: WarehouseView[]): Option[] => {
    return warehouses.map((warehouse) => ({
        value: warehouse.id,
        label: warehouse.name,
    }));
};
