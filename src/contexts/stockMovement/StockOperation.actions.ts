'use server';

import { db } from '@/infrastructure/database/client';
import { projectMutationAction } from '@/shared/api/action-client';
import { Permission } from '@/contexts/user/User.types';
import { findWarehouseInProject } from '@/contexts/warehouse/Warehouse.lib';
import {
    CountStockActionInputSchema,
    ReceiveStockActionInputSchema,
    StockOperationActionInputSchema,
    TransferStockActionInputSchema,
} from './StockMovement.schema';
import {
    countStock,
    receiveStock,
    transferStock,
    writeOffStock,
} from './StockOperation.lib';

interface OperationInput {
    projectId: string;
    productId: string;
    variantId?: string | null;
    warehouseId: string;
    quantity: number;
    note?: string;
}

const operationOf = async (input: OperationInput, createdBy: string) => {
    const warehouse = await findWarehouseInProject(
        input.warehouseId,
        input.projectId,
    );

    return {
        projectId: input.projectId,
        productId: input.productId,
        variantId: input.variantId ?? null,
        warehouseId: warehouse.id,
        quantity: input.quantity,
        note: input.note || null,
        createdBy,
    };
};

export const receiveStockAction = projectMutationAction(
    Permission.MANAGE_CATALOG,
)
    .inputSchema(ReceiveStockActionInputSchema)
    .action(async ({ parsedInput, ctx: { userId } }) => {
        const operation = await operationOf(parsedInput, userId);

        await db.transaction((tx) =>
            receiveStock(tx, {
                ...operation,
                costAmount: parsedInput.costAmount ?? null,
            }),
        );

        return { ok: true };
    });

export const writeOffStockAction = projectMutationAction(
    Permission.MANAGE_CATALOG,
)
    .inputSchema(StockOperationActionInputSchema)
    .action(async ({ parsedInput, ctx: { userId } }) => {
        const operation = await operationOf(parsedInput, userId);

        await db.transaction((tx) => writeOffStock(tx, operation));

        return { ok: true };
    });

export const countStockAction = projectMutationAction(Permission.MANAGE_CATALOG)
    .inputSchema(CountStockActionInputSchema)
    .action(async ({ parsedInput, ctx: { userId } }) => {
        const operation = await operationOf(parsedInput, userId);

        await db.transaction((tx) => countStock(tx, operation));

        return { ok: true };
    });

export const transferStockAction = projectMutationAction(
    Permission.MANAGE_CATALOG,
)
    .inputSchema(TransferStockActionInputSchema)
    .action(async ({ parsedInput, ctx: { userId } }) => {
        const [operation, target] = await Promise.all([
            operationOf(parsedInput, userId),
            findWarehouseInProject(
                parsedInput.toWarehouseId,
                parsedInput.projectId,
            ),
        ]);

        await db.transaction((tx) =>
            transferStock(tx, { ...operation, toWarehouseId: target.id }),
        );

        return { ok: true };
    });
