'use server';

import { db } from '@/infrastructure/database/client';
import {
    projectMutationAction,
    projectReadAction,
} from '@/shared/api/action-client';
import { ApplicationError } from '@/shared/api/errors';
import {
    assertUniqueInProject,
    insertOne,
    updateInProject,
} from '@/shared/api/repository';
import { stockReservations } from '@/contexts/stockMovement/StockMovements.table';
import {
    CATALOG_READ_PERMISSIONS,
    Permission,
} from '@/contexts/user/User.types';
import { and, eq, gt } from 'drizzle-orm';
import {
    findWarehouseInProject,
    listWarehouses,
    makePrimaryWarehouse,
} from './Warehouse.lib';
import {
    CreateWarehouseActionInputSchema,
    DeleteWarehouseActionInputSchema,
    MakePrimaryWarehouseActionInputSchema,
    UpdateWarehouseActionInputSchema,
    WarehousesActionInputSchema,
} from './Warehouse.schema';
import { warehouseStock, warehouses } from './Warehouses.table';

const assertNameFree = (
    projectId: string,
    name: string,
    excludeId?: string,
) => {
    return assertUniqueInProject({
        table: warehouses,
        column: warehouses.name,
        value: name,
        projectId,
        excludeId,
        conflict: `Склад «${name}» уже есть в проекте`,
    });
};

export const warehousesAction = projectReadAction(CATALOG_READ_PERMISSIONS)
    .inputSchema(WarehousesActionInputSchema)
    .action(({ parsedInput: { projectId } }) => listWarehouses(projectId));

export const createWarehouseAction = projectMutationAction(
    Permission.MANAGE_CATALOG,
)
    .inputSchema(CreateWarehouseActionInputSchema)
    .action(async ({ parsedInput: { projectId, forSite, ...input } }) => {
        const name = input.name.trim();

        const [existing] = await Promise.all([
            listWarehouses(projectId),
            assertNameFree(projectId, name),
        ]);

        return insertOne(
            warehouses,
            { projectId, name, forSite, position: existing.length },
            'Не удалось создать склад',
        );
    });

export const updateWarehouseAction = projectMutationAction(
    Permission.MANAGE_CATALOG,
)
    .inputSchema(UpdateWarehouseActionInputSchema)
    .action(async ({ parsedInput: { id, projectId, ...patch } }) => {
        const name = patch.name?.trim();

        if (name) await assertNameFree(projectId, name, id);

        return updateInProject(
            warehouses,
            id,
            projectId,
            { ...patch, name },
            'Склад не найден',
        );
    });

export const makePrimaryWarehouseAction = projectMutationAction(
    Permission.MANAGE_CATALOG,
)
    .inputSchema(MakePrimaryWarehouseActionInputSchema)
    .action(({ parsedInput: { id, projectId } }) =>
        db.transaction((tx) => makePrimaryWarehouse(tx, projectId, id)),
    );

export const deleteWarehouseAction = projectMutationAction(
    Permission.MANAGE_CATALOG,
)
    .inputSchema(DeleteWarehouseActionInputSchema)
    .action(async ({ parsedInput: { id, projectId } }) => {
        const [warehouse, all, [stocked], [reserved]] = await Promise.all([
            findWarehouseInProject(id, projectId),
            listWarehouses(projectId),
            db
                .select({ id: warehouseStock.id })
                .from(warehouseStock)
                .where(
                    and(
                        eq(warehouseStock.warehouseId, id),
                        gt(warehouseStock.quantity, 0),
                    ),
                )
                .limit(1),
            db
                .select({ id: stockReservations.id })
                .from(stockReservations)
                .where(eq(stockReservations.warehouseId, id))
                .limit(1),
        ]);

        if (all.length === 1) {
            throw new ApplicationError(
                'В проекте должен остаться хотя бы один склад',
            );
        }
        if (stocked || reserved) {
            throw new ApplicationError(
                `На складе «${warehouse.name}» есть товар или брони — сначала переместите их`,
            );
        }

        await db
            .update(warehouses)
            .set({ deletedAt: new Date() })
            .where(eq(warehouses.id, warehouse.id));

        return { ok: true };
    });
