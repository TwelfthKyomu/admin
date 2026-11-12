import { enumValues } from '@/shared/lib/enum';
import type { ProductRecord } from '@/contexts/product/Products.table';
import type { StockMovementRecord } from './StockMovements.table';

export const StockMovementReason = {
    SALE: 'sale',
    RETURN: 'return',
    MANUAL: 'manual',
    WRITE_OFF: 'write_off',
    RECEIPT: 'receipt',
    TRANSFER: 'transfer',
} as const;

export type StockMovementReason =
    (typeof StockMovementReason)[keyof typeof StockMovementReason];

export const STOCK_MOVEMENT_REASON_VALUES = enumValues(StockMovementReason);

export const STOCK_RESERVATION_MINUTES = 30;

export type StockTarget = Pick<
    StockMovementRecord,
    'projectId' | 'productId' | 'variantId'
>;

export interface StockLine extends Omit<StockTarget, 'projectId'> {
    quantity: number;
}

export interface ManualStockChange
    extends StockTarget,
        Pick<StockMovementRecord, 'note'> {
    before: number | null;
    after: number | null;
    createdBy: string;
}

export interface ReservedLine extends StockLine {
    warehouseId: string;
}

export interface OrderStockLine extends ReservedLine {
    reserved: boolean;
}

export interface StockLevelView
    extends Pick<ProductRecord, 'name' | 'sku' | 'type' | 'stock'> {
    id: string;
    productId: string;
    variantId: string | null;
    byWarehouse: Record<string, number>;
    reserved: number;
}

export const averageCost = (input: {
    onHand: number;
    cost: number | null;
    quantity: number;
    receiptCost: number;
}): number => {
    if (input.cost === null || input.onHand <= 0) return input.receiptCost;

    const total =
        input.onHand * input.cost + input.quantity * input.receiptCost;

    return Math.round(total / (input.onHand + input.quantity));
};

export const stockKey = (
    target: Pick<StockTarget, 'productId' | 'variantId'>,
): string => {
    return target.variantId ?? target.productId;
};

export const siteStock = (
    stock: number | null,
    siteFree: number | undefined,
): number | null => {
    return stock === null ? null : (siteFree ?? 0);
};

export const saleAllocations = (
    line: StockLine,
    reservations: ReservedLine[],
    fallbackWarehouseId: string,
): ReservedLine[] => {
    const key = stockKey(line);
    const allocations: ReservedLine[] = [];
    let left = line.quantity;

    for (const reservation of reservations) {
        if (left === 0) break;
        if (stockKey(reservation) !== key) continue;

        const quantity = Math.min(left, reservation.quantity);

        allocations.push({ ...reservation, quantity });
        left -= quantity;
    }

    if (left > 0) {
        allocations.push({
            ...line,
            warehouseId: fallbackWarehouseId,
            quantity: left,
        });
    }

    return allocations;
};

export const mergeStockLines = (lines: StockLine[]): StockLine[] => {
    const byKey = new Map<string, StockLine>();

    for (const line of lines) {
        if (line.quantity <= 0) continue;

        const key = stockKey(line);
        const quantity = (byKey.get(key)?.quantity ?? 0) + line.quantity;

        byKey.set(key, { ...line, quantity });
    }

    return [...byKey.entries()]
        .toSorted(([a], [b]) => a.localeCompare(b))
        .map(([, line]) => line);
};
