import 'server-only';

import { db, type Reader, type Tx } from '@/infrastructure/database/client';
import { ApplicationError } from '@/shared/api/errors';
import { findInProject } from '@/shared/api/repository';
import type { StockTarget } from '@/contexts/stockMovement/StockMovement.types';
import { and, asc, eq, isNull } from 'drizzle-orm';
import { PRIMARY_WAREHOUSE_NAME } from './Warehouse.types';
import {
    type WarehouseRecord,
    warehouseStock,
    warehouses,
} from './Warehouses.table';

const activeWarehouses = (projectId: string) => {
    return and(
        eq(warehouses.projectId, projectId),
        isNull(warehouses.deletedAt),
    );
};

const stockLine = (
    warehouseId: string,
    target: Pick<StockTarget, 'productId' | 'variantId'>,
) => {
    return and(
        eq(warehouseStock.warehouseId, warehouseId),
        eq(warehouseStock.productId, target.productId),
        target.variantId
            ? eq(warehouseStock.variantId, target.variantId)
            : isNull(warehouseStock.variantId),
    );
};

export const listWarehouses = (
    projectId: string,
    executor: Reader = db,
): Promise<WarehouseRecord[]> => {
    return executor
        .select()
        .from(warehouses)
        .where(activeWarehouses(projectId))
        .orderBy(asc(warehouses.position), asc(warehouses.createdAt));
};

export const findWarehouseInProject = (
    id: string,
    projectId: string,
): Promise<WarehouseRecord> => {
    return findInProject(warehouses, id, projectId, 'Склад не найден');
};

export const primaryWarehouseId = async (
    projectId: string,
    executor: Reader = db,
): Promise<string> => {
    const [first] = await listWarehouses(projectId, executor);

    if (!first) throw new ApplicationError('В проекте нет склада');

    return first.id;
};

export const siteWarehouseIds = async (
    projectId: string,
    executor: Reader = db,
): Promise<string[]> => {
    const all = await listWarehouses(projectId, executor);

    return all.filter((warehouse) => warehouse.forSite).map(({ id }) => id);
};

export const makePrimaryWarehouse = async (
    tx: Tx,
    projectId: string,
    id: string,
): Promise<WarehouseRecord> => {
    const all = await listWarehouses(projectId, tx);
    const primary = all.find((warehouse) => warehouse.id === id);

    if (!primary) throw new ApplicationError('Склад не найден');

    const ordered = [
        primary,
        ...all.filter((warehouse) => warehouse.id !== id),
    ];

    for (const [position, warehouse] of ordered.entries()) {
        await tx
            .update(warehouses)
            .set({ position })
            .where(eq(warehouses.id, warehouse.id));
    }

    return primary;
};

export const createPrimaryWarehouse = async (
    tx: Tx,
    projectId: string,
): Promise<void> => {
    await tx
        .insert(warehouses)
        .values({ projectId, name: PRIMARY_WAREHOUSE_NAME, position: 0 });
};

export const warehouseQuantity = async (
    tx: Tx,
    warehouseId: string,
    target: Pick<StockTarget, 'productId' | 'variantId'>,
): Promise<number> => {
    const [row] = await tx
        .select({ quantity: warehouseStock.quantity })
        .from(warehouseStock)
        .where(stockLine(warehouseId, target))
        .limit(1);

    return row?.quantity ?? 0;
};

export const changeWarehouseQuantity = async (
    tx: Tx,
    warehouseId: string,
    target: StockTarget,
    delta: number,
): Promise<void> => {
    const [row] = await tx
        .select({ id: warehouseStock.id, quantity: warehouseStock.quantity })
        .from(warehouseStock)
        .where(stockLine(warehouseId, target))
        .limit(1);

    const quantity = (row?.quantity ?? 0) + delta;

    if (quantity < 0) {
        throw new ApplicationError(
            `На складе только ${row?.quantity ?? 0} шт. — столько не списать`,
        );
    }

    if (row) {
        await tx
            .update(warehouseStock)
            .set({ quantity })
            .where(eq(warehouseStock.id, row.id));

        return;
    }

    await tx
        .insert(warehouseStock)
        .values({ ...target, warehouseId, quantity });
};

export const clearWarehouseQuantities = async (
    tx: Tx,
    target: Pick<StockTarget, 'productId' | 'variantId'>,
): Promise<void> => {
    await tx
        .delete(warehouseStock)
        .where(
            and(
                eq(warehouseStock.productId, target.productId),
                target.variantId
                    ? eq(warehouseStock.variantId, target.variantId)
                    : isNull(warehouseStock.variantId),
            ),
        );
};

export const loadWarehouseQuantities = (projectId: string) => {
    return db
        .select({
            warehouseId: warehouseStock.warehouseId,
            productId: warehouseStock.productId,
            variantId: warehouseStock.variantId,
            quantity: warehouseStock.quantity,
        })
        .from(warehouseStock)
        .where(eq(warehouseStock.projectId, projectId));
};
