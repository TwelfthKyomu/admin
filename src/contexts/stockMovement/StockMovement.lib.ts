import 'server-only';

import type { Tx } from '@/infrastructure/database/client';
import {
    changeWarehouseQuantity,
    clearWarehouseQuantities,
    primaryWarehouseId,
    warehouseQuantity,
} from '@/contexts/warehouse/Warehouse.lib';
import { and, eq } from 'drizzle-orm';
import { lockStock, setStock } from './StockLevel.lib';
import {
    type ManualStockChange,
    mergeStockLines,
    type StockLine,
    StockMovementReason,
    type StockTarget,
    saleAllocations,
    stockKey,
} from './StockMovement.types';
import {
    type NewStockMovementRecord,
    stockMovements,
} from './StockMovements.table';
import { orderReservations, releaseOrderStock } from './StockReservation.lib';

interface OrderStockInput {
    orderId: string;
    projectId: string;
    createdBy: string | null;
}

export interface StockMove
    extends StockTarget,
        Pick<
            NewStockMovementRecord,
            'warehouseId' | 'quantityDelta' | 'reason' | 'note' | 'orderId'
        > {
    createdBy: string | null;
    startsTracking?: boolean;
}

export async function moveStock(tx: Tx, move: StockMove): Promise<void> {
    if (move.quantityDelta === 0) return;

    const current = await lockStock(tx, move);

    if (!current) return;

    const inserted = await tx
        .insert(stockMovements)
        .values({
            projectId: move.projectId,
            productId: move.productId,
            variantId: move.variantId,
            warehouseId: move.warehouseId,
            quantityDelta: move.quantityDelta,
            reason: move.reason,
            note: move.note,
            orderId: move.orderId,
            createdBy: move.createdBy,
        })
        .onConflictDoNothing()
        .returning({ id: stockMovements.id });

    if (inserted.length === 0) return;
    if (current.stock === null && !move.startsTracking) return;

    await changeWarehouseQuantity(
        tx,
        move.warehouseId,
        move,
        move.quantityDelta,
    );

    await setStock(tx, move, (current.stock ?? 0) + move.quantityDelta);
}

async function soldKeys(tx: Tx, orderId: string): Promise<Set<string>> {
    const rows = await tx
        .select({
            productId: stockMovements.productId,
            variantId: stockMovements.variantId,
        })
        .from(stockMovements)
        .where(
            and(
                eq(stockMovements.orderId, orderId),
                eq(stockMovements.reason, StockMovementReason.SALE),
            ),
        );

    return new Set(rows.map(stockKey));
}

export async function applyStockSale(
    tx: Tx,
    input: OrderStockInput & { lines: StockLine[] },
): Promise<void> {
    const [sold, reservations, fallbackWarehouseId] = await Promise.all([
        soldKeys(tx, input.orderId),
        orderReservations(tx, input.orderId),
        primaryWarehouseId(input.projectId, tx),
    ]);

    for (const line of mergeStockLines(input.lines)) {
        if (sold.has(stockKey(line))) continue;

        const target = { ...line, projectId: input.projectId };
        const current = await lockStock(tx, target);

        if (!current) continue;

        for (const allocation of saleAllocations(
            line,
            reservations,
            fallbackWarehouseId,
        )) {
            const onHand =
                current.stock === null
                    ? allocation.quantity
                    : await warehouseQuantity(tx, allocation.warehouseId, line);

            const quantity = Math.min(allocation.quantity, onHand);

            await moveStock(tx, {
                ...target,
                warehouseId: allocation.warehouseId,
                quantityDelta: -quantity,
                reason: StockMovementReason.SALE,
                orderId: input.orderId,
                createdBy: input.createdBy,
                note:
                    quantity < allocation.quantity
                        ? `Продано ${allocation.quantity}, на складе было ${onHand}`
                        : null,
            });
        }
    }

    await releaseOrderStock(tx, input.orderId);
}

export async function applyStockReturn(
    tx: Tx,
    input: OrderStockInput,
): Promise<void> {
    const sales = await tx
        .select({
            productId: stockMovements.productId,
            variantId: stockMovements.variantId,
            warehouseId: stockMovements.warehouseId,
            quantityDelta: stockMovements.quantityDelta,
        })
        .from(stockMovements)
        .where(
            and(
                eq(stockMovements.orderId, input.orderId),
                eq(stockMovements.reason, StockMovementReason.SALE),
            ),
        );

    for (const sale of sales) {
        await moveStock(tx, {
            ...sale,
            projectId: input.projectId,
            quantityDelta: -sale.quantityDelta,
            reason: StockMovementReason.RETURN,
            orderId: input.orderId,
            createdBy: input.createdBy,
            note: null,
        });
    }

    await releaseOrderStock(tx, input.orderId);
}

export async function applyCatalogStockChanges(
    tx: Tx,
    changes: ManualStockChange[],
): Promise<void> {
    const changed = changes.filter(
        (change) => (change.after ?? 0) !== (change.before ?? 0),
    );

    const [first] = changed;

    if (!first) return;

    const warehouseId = await primaryWarehouseId(first.projectId, tx);

    for (const change of changed) {
        const quantityDelta = (change.after ?? 0) - (change.before ?? 0);

        if (change.after === null) {
            await clearWarehouseQuantities(tx, change);
        } else {
            await changeWarehouseQuantity(
                tx,
                warehouseId,
                change,
                quantityDelta,
            );
        }

        await tx.insert(stockMovements).values({
            projectId: change.projectId,
            productId: change.productId,
            variantId: change.variantId,
            warehouseId,
            quantityDelta,
            reason: StockMovementReason.MANUAL,
            note: change.note,
            createdBy: change.createdBy,
        });
    }
}
