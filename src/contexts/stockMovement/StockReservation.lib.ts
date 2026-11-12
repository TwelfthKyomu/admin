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
    type OrderStockLine,
    type ReservedLine,
    type StockLine,
    StockMovementReason,
    type StockTarget,
    stockKey,
} from './StockMovement.types';
import {
    type NewStockReservationRecord,
    stockMovements,
    stockReservations,
} from './StockMovements.table';

const activeReservation = (now: Date) => {
    return or(
        isNull(stockReservations.expiresAt),
        gt(stockReservations.expiresAt, now),
    );
};

const reservedQuantity = async (
    tx: Tx,
    warehouseId: string,
    target: Pick<StockTarget, 'productId' | 'variantId'>,
): Promise<number> => {
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
};

export const freeInWarehouse = async (
    tx: Tx,
    warehouseId: string,
    target: Pick<StockTarget, 'productId' | 'variantId'>,
): Promise<number> => {
    const [quantity, reserved] = await Promise.all([
        warehouseQuantity(tx, warehouseId, target),
        reservedQuantity(tx, warehouseId, target),
    ]);

    return quantity - reserved;
};

export const reserveOrderStock = async (
    tx: Tx,
    input: {
        orderId: string;
        projectId: string;
        lines: StockLine[];
        expiresAt: Date | null;
        warehouseIds: string[];
    },
): Promise<void> => {
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
};

export const orderReservations = (
    tx: Tx,
    orderId: string,
): Promise<ReservedLine[]> => {
    return tx
        .select({
            productId: stockReservations.productId,
            variantId: stockReservations.variantId,
            warehouseId: stockReservations.warehouseId,
            quantity: stockReservations.quantity,
        })
        .from(stockReservations)
        .where(eq(stockReservations.orderId, orderId));
};

export const releaseOrderStock = async (
    tx: Tx,
    orderId: string,
): Promise<void> => {
    await tx
        .delete(stockReservations)
        .where(eq(stockReservations.orderId, orderId));
};

export const loadOrderStock = async (
    projectId: string,
    orderId: string,
): Promise<OrderStockLine[]> => {
    const [reserved, moved] = await Promise.all([
        db
            .select({
                productId: stockReservations.productId,
                variantId: stockReservations.variantId,
                warehouseId: stockReservations.warehouseId,
                quantity: stockReservations.quantity,
            })
            .from(stockReservations)
            .where(
                and(
                    eq(stockReservations.projectId, projectId),
                    eq(stockReservations.orderId, orderId),
                    activeReservation(new Date()),
                ),
            ),
        db
            .select({
                productId: stockMovements.productId,
                variantId: stockMovements.variantId,
                warehouseId: stockMovements.warehouseId,
                quantity: sum(stockMovements.quantityDelta).mapWith(Number),
            })
            .from(stockMovements)
            .where(
                and(
                    eq(stockMovements.projectId, projectId),
                    eq(stockMovements.orderId, orderId),
                    inArray(stockMovements.reason, [
                        StockMovementReason.SALE,
                        StockMovementReason.RETURN,
                    ]),
                ),
            )
            .groupBy(
                stockMovements.productId,
                stockMovements.variantId,
                stockMovements.warehouseId,
            ),
    ]);

    return [
        ...reserved.map((line) => ({ ...line, reserved: true })),
        ...moved
            .filter((line) => line.quantity < 0)
            .map((line) => ({
                ...line,
                quantity: -line.quantity,
                reserved: false,
            })),
    ];
};

export const loadActiveReservations = (projectId: string) => {
    return db
        .select({
            productId: stockReservations.productId,
            variantId: stockReservations.variantId,
            total: sum(stockReservations.quantity).mapWith(Number),
        })
        .from(stockReservations)
        .where(
            and(
                eq(stockReservations.projectId, projectId),
                activeReservation(new Date()),
            ),
        )
        .groupBy(stockReservations.productId, stockReservations.variantId);
};

export const loadSiteFreeStock = async (
    productIds: string[],
): Promise<Map<string, number>> => {
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
};
