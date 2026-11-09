import 'server-only';

import type { Tx } from '@/infrastructure/database/client';
import { ApplicationError } from '@/shared/api/errors';
import { ProductType } from '@/contexts/product/Product.types';
import { warehouseQuantity } from '@/contexts/warehouse/Warehouse.lib';
import { type LockedStock, lockStock } from './StockLevel.lib';
import { moveStock } from './StockMovement.lib';
import { StockMovementReason, type StockTarget } from './StockMovement.types';
import { freeInWarehouse } from './StockReservation.lib';

interface StockOperation extends StockTarget {
    warehouseId: string;
    quantity: number;
    note: string | null;
    createdBy: string;
}

async function lockStockable(
    tx: Tx,
    target: StockTarget,
): Promise<LockedStock> {
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
}

async function assertFree(tx: Tx, operation: StockOperation): Promise<void> {
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
}

export async function receiveStock(
    tx: Tx,
    operation: StockOperation,
): Promise<void> {
    await lockStockable(tx, operation);

    await moveStock(tx, {
        ...operation,
        quantityDelta: operation.quantity,
        reason: StockMovementReason.RECEIPT,
        startsTracking: true,
    });
}

export async function writeOffStock(
    tx: Tx,
    operation: StockOperation,
): Promise<void> {
    await assertFree(tx, operation);

    await moveStock(tx, {
        ...operation,
        quantityDelta: -operation.quantity,
        reason: StockMovementReason.WRITE_OFF,
    });
}

export async function transferStock(
    tx: Tx,
    operation: StockOperation & { toWarehouseId: string },
): Promise<void> {
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
}

export async function countStock(
    tx: Tx,
    operation: StockOperation,
): Promise<void> {
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
}
