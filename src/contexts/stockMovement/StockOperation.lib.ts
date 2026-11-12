import 'server-only';

import type { Tx } from '@/infrastructure/database/client';
import { ApplicationError } from '@/shared/api/errors';
import { ProductType } from '@/contexts/product/Product.types';
import { products } from '@/contexts/product/Products.table';
import { warehouseQuantity } from '@/contexts/warehouse/Warehouse.lib';
import { warehouseStock } from '@/contexts/warehouse/Warehouses.table';
import { eq, sum } from 'drizzle-orm';
import { type LockedStock, lockStock } from './StockLevel.lib';
import { moveStock } from './StockMovement.lib';
import {
    averageCost,
    StockMovementReason,
    type StockTarget,
} from './StockMovement.types';
import { freeInWarehouse } from './StockReservation.lib';

interface StockOperation extends StockTarget {
    warehouseId: string;
    quantity: number;
    note: string | null;
    createdBy: string;
}

interface StockReceipt extends StockOperation {
    costAmount: number | null;
}

const applyReceiptCost = async (
    tx: Tx,
    receipt: StockReceipt,
): Promise<void> => {
    if (receipt.costAmount === null) return;

    const [[product], [held]] = await Promise.all([
        tx
            .select({ costAmount: products.costAmount })
            .from(products)
            .where(eq(products.id, receipt.productId))
            .limit(1),
        tx
            .select({ onHand: sum(warehouseStock.quantity).mapWith(Number) })
            .from(warehouseStock)
            .where(eq(warehouseStock.productId, receipt.productId)),
    ]);

    const costAmount = averageCost({
        onHand: held?.onHand ?? 0,
        cost: product?.costAmount ?? null,
        quantity: receipt.quantity,
        receiptCost: receipt.costAmount,
    });

    await tx
        .update(products)
        .set({ costAmount })
        .where(eq(products.id, receipt.productId));
};

const lockStockable = async (
    tx: Tx,
    target: StockTarget,
): Promise<LockedStock> => {
    const current = await lockStock(tx, target);

    if (!current) {
        throw new ApplicationError(
            target.variantId ? 'Вариант товара не найден' : 'Товар не найден',
        );
    }
    if (current.type === ProductType.SERVICE) {
        throw new ApplicationError('Остаток неприменим к услугам');
    }

    return current;
};

const assertFree = async (tx: Tx, operation: StockOperation): Promise<void> => {
    const current = await lockStockable(tx, operation);

    if (current.stock === null) {
        throw new ApplicationError('Остаток этого товара не ведётся');
    }

    const free = await freeInWarehouse(tx, operation.warehouseId, operation);

    if (operation.quantity > free) {
        throw new ApplicationError(
            `На складе свободно только ${Math.max(0, free)} шт.`,
        );
    }
};

export const receiveStock = async (
    tx: Tx,
    { costAmount, ...operation }: StockReceipt,
): Promise<void> => {
    await lockStockable(tx, operation);
    await applyReceiptCost(tx, { ...operation, costAmount });

    await moveStock(tx, {
        ...operation,
        quantityDelta: operation.quantity,
        reason: StockMovementReason.RECEIPT,
        startsTracking: true,
    });
};

export const writeOffStock = async (
    tx: Tx,
    operation: StockOperation,
): Promise<void> => {
    await assertFree(tx, operation);

    await moveStock(tx, {
        ...operation,
        quantityDelta: -operation.quantity,
        reason: StockMovementReason.WRITE_OFF,
    });
};

export const transferStock = async (
    tx: Tx,
    operation: StockOperation & { toWarehouseId: string },
): Promise<void> => {
    if (operation.toWarehouseId === operation.warehouseId) {
        throw new ApplicationError('Выберите другой склад');
    }

    await assertFree(tx, operation);

    const { toWarehouseId, ...from } = operation;

    await moveStock(tx, {
        ...from,
        quantityDelta: -operation.quantity,
        reason: StockMovementReason.TRANSFER,
    });

    await moveStock(tx, {
        ...from,
        warehouseId: toWarehouseId,
        quantityDelta: operation.quantity,
        reason: StockMovementReason.TRANSFER,
    });
};

export const countStock = async (
    tx: Tx,
    operation: StockOperation,
): Promise<void> => {
    await lockStockable(tx, operation);

    const onHand = await warehouseQuantity(
        tx,
        operation.warehouseId,
        operation,
    );

    await moveStock(tx, {
        ...operation,
        quantityDelta: operation.quantity - onHand,
        reason: StockMovementReason.MANUAL,
        startsTracking: true,
    });
};
