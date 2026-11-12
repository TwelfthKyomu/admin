import { ProductType } from '@/contexts/product';
import type { StockLevelView } from '@/contexts/stockMovement';
import type { TableActionItem } from '@/ui/Base';
import { STOCK_OPERATION_TEXT, StockOperationType } from './stockOperation';

interface StockActionHandlers {
    onOperation: (type: StockOperationType, row: StockLevelView) => void;
    onTransfer: (row: StockLevelView) => void;
}

export const stockActionItems = (
    row: StockLevelView,
    warehousesCount: number,
    { onOperation, onTransfer }: StockActionHandlers,
): TableActionItem[] => {
    if (row.type === ProductType.SERVICE) return [];

    const tracked = row.stock !== undefined;

    const operation = (type: StockOperationType): TableActionItem => ({
        key: type,
        label: STOCK_OPERATION_TEXT[type].title,
        onSelect: () => onOperation(type, row),
    });

    return [
        operation(StockOperationType.RECEIPT),
        ...(tracked ? [operation(StockOperationType.WRITE_OFF)] : []),
        ...(tracked && warehousesCount > 1
            ? [
                  {
                      key: 'transfer',
                      label: 'Перемещение',
                      onSelect: () => onTransfer(row),
                  },
              ]
            : []),
        operation(StockOperationType.COUNT),
    ];
};
