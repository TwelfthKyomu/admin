import 'server-only';

import { db, type Tx } from '@/infrastructure/database/client';
import { ApplicationError } from '@/shared/api/errors';
import { warehouseQuantity } from '@/contexts/warehouse/Warehouse.lib';
import { allocateAcrossWarehouses } from '@/contexts/warehouse/Warehouse.types';
import {
    warehouseStock,
    warehouses,
} from '@/contexts/warehouse/Warehouses.table';
import { and, eq, gt, inArray, isNull, or, sum } from 'drizzle-orm';
import { lockStock } from './StockLevel.lib';
import {
    mergeStockLines,
    type ReservedLine,
    type StockLine,
    type StockTarget,
    stockKey,
} from './StockMovement.types';
import {
    type NewStockReservationRecord,
    stockReservations,
} from './StockMovements.table';

function activeReservation(now: Date) {
    return or(
        isNull(stockReservations.expiresAt),
        gt(stockReservations.expiresAt, now),
    );
}

async function reservedQuantity(
    tx: Tx,
    warehouseId: string,
    target: Pick<StockTarget, 'productId' | 'variantId'>,
): Promise<number> {
    const [row] = await tx
        .select({ reserved: sum(stockReservations.quantity).mapWith(Number) })
        .from(stockReservations)
        .where(
            and(
                eq(stockReservations.warehouseId, warehouseId),
                eq(stockReservations.productId, target.productId),
                target.variantId
                    ? eq(stockReservations.variantId, target.variantId)
                    : isNull(stockReservations.variantId),
                activeReservation(new Date()),
            ),
        );

    return row?.reserved ?? 0;
}

export async function freeInWarehouse(
    tx: Tx,
    warehouseId: string,
    target: Pick<StockTarget, 'productId' | 'variantId'>,
): Promise<number> {
    const [quantity, reserved] = await Promise.all([
        warehouseQuantity(tx, warehouseId, target),
        reservedQuantity(tx, warehouseId, target),
    ]);

    return quantity - reserved;
}

export async function reserveOrderStock(
    tx: Tx,
    input: {
        orderId: string;
        projectId: string;
        lines: StockLine[];
        expiresAt: Date | null;
        warehouseIds: string[];
    },
): Promise<void> {
    const rows: NewStockReservationRecord[] = [];

    for (const line of mergeStockLines(input.lines)) {
        const target = { ...line, projectId: input.projectId };
        const current = await lockStock(tx, target);

        if (!current || current.stock === null) continue;

        const candidates = [];

        for (const warehouseId of input.warehouseIds) {
            const free = await freeInWarehouse(tx, warehouseId, line);

            candidates.push({ warehouseId, free });
        }

        const allocations = allocateAcrossWarehouses(line.quantity, candidates);

        if (!allocations) {
            const free = candidates.reduce(
                (total, candidate) => total + Math.max(0, candidate.free),
                0,
            );

            throw new ApplicationError(
                `Недостаточно «${current.name}» на складе: свободно ${free}`,
            );
        }

        rows.push(
            ...allocations.map((allocation) => ({
                ...target,
                ...allocation,
                orderId: input.orderId,
                expiresAt: input.expiresAt,
            })),
        );
    }

    if (rows.length === 0) return;

    await tx.insert(stockReservations).values(rows);
}

export function orderReservations(
    tx: Tx,
    orderId: string,
): Promise<ReservedLine[]> {
    return tx
        .select({
            productId: stockReservations.productId,
            variantId: stockReservations.variantId,
            warehouseId: stockReservations.warehouseId,
            quantity: stockReservations.quantity,
        })
        .from(stockReservations)
        .where(eq(stockReservations.orderId, orderId));
}

export async function releaseOrderStock(
    tx: Tx,
    orderId: string,
): Promise<void> {
    await tx
        .delete(stockReservations)
        .where(eq(stockReservations.orderId, orderId));
}

export async function loadSiteFreeStock(
    productIds: string[],
): Promise<Map<string, number>> {
    const siteWarehouse = and(
        eq(warehouses.forSite, true),
        isNull(warehouses.deletedAt),
    );

    const [quantities, reservations] = await Promise.all([
        db
            .select({
                productId: warehouseStock.productId,
                variantId: warehouseStock.variantId,
                total: sum(warehouseStock.quantity).mapWith(Number),
            })
            .from(warehouseStock)
            .innerJoin(
                warehouses,
                eq(warehouses.id, warehouseStock.warehouseId),
            )
            .where(
                and(
                    inArray(warehouseStock.productId, productIds),
                    siteWarehouse,
                ),
            )
            .groupBy(warehouseStock.productId, warehouseStock.variantId),
        db
            .select({
                productId: stockReservations.productId,
                variantId: stockReservations.variantId,
                total: sum(stockReservations.quantity).mapWith(Number),
            })
            .from(stockReservations)
            .innerJoin(
                warehouses,
                eq(warehouses.id, stockReservations.warehouseId),
            )
            .where(
                and(
                    inArray(stockReservations.productId, productIds),
                    siteWarehouse,
                    activeReservation(new Date()),
                ),
            )
            .groupBy(stockReservations.productId, stockReservations.variantId),
    ]);

    const reserved = new Map(
        reservations.map((row) => [stockKey(row), row.total]),
    );

    return new Map(
        quantities.map((row) => [
            stockKey(row),
            Math.max(0, row.total - (reserved.get(stockKey(row)) ?? 0)),
        ]),
    );
}
