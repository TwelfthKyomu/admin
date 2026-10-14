'use server';

import { db } from '@/infrastructure/database/client';
import {
    projectMutationAction,
    projectReadAction,
} from '@/shared/api/action-client';
import { PAGE_SIZE_LARGE } from '@/shared/constants/default';
import { loadVariants } from '@/contexts/product/Product.lib';
import { variantComboLabel } from '@/contexts/product/Product.types';
import { products } from '@/contexts/product/Products.table';
import {
    CATALOG_READ_PERMISSIONS,
    Permission,
} from '@/contexts/user/User.types';
import { and, asc, desc, eq, isNull } from 'drizzle-orm';
import { adjustStock } from './StockMovement.lib';
import {
    AdjustStockActionInputSchema,
    StockMovementsActionInputSchema,
    StockOverviewActionInputSchema,
} from './StockMovement.schema';
import type { StockLevelView } from './StockMovement.types';
import { stockMovements } from './StockMovements.table';

export const stockOverviewAction = projectReadAction(CATALOG_READ_PERMISSIONS)
    .inputSchema(StockOverviewActionInputSchema)
    .action(async ({ parsedInput: { projectId } }) => {
        const rows = await db
            .select({
                id: products.id,
                name: products.name,
                sku: products.sku,
                type: products.type,
                stock: products.stock,
            })
            .from(products)
            .where(
                and(
                    eq(products.projectId, projectId),
                    isNull(products.deletedAt),
                ),
            )
            .orderBy(asc(products.name));

        const variantsByProduct = await loadVariants(rows.map((row) => row.id));

        return rows.flatMap<StockLevelView>((row) => {
            const variants = variantsByProduct.get(row.id) ?? [];

            if (variants.length === 0) {
                return [{ ...row, productId: row.id, variantId: null }];
            }

            return variants.map((variant) => ({
                id: `${row.id}:${variant.id}`,
                productId: row.id,
                variantId: variant.id,
                name: `${row.name} (${variantComboLabel(variant.optionValues)})`,
                sku: variant.sku ?? row.sku,
                type: row.type,
                stock: variant.stock,
            }));
        });
    });

export const stockMovementsAction = projectReadAction(CATALOG_READ_PERMISSIONS)
    .inputSchema(StockMovementsActionInputSchema)
    .action(async ({ parsedInput: { projectId, productId } }) => {
        const filters = [eq(stockMovements.projectId, projectId)];

        if (productId) filters.push(eq(stockMovements.productId, productId));

        return db
            .select()
            .from(stockMovements)
            .where(and(...filters))
            .orderBy(desc(stockMovements.occurredAt))
            .limit(PAGE_SIZE_LARGE);
    });

export const adjustStockAction = projectMutationAction(
    Permission.MANAGE_CATALOG,
)
    .inputSchema(AdjustStockActionInputSchema)
    .action(
        async ({
            parsedInput: { projectId, productId, variantId, stock, note },
            ctx: { userId },
        }) => {
            await db.transaction((tx) =>
                adjustStock(tx, {
                    projectId,
                    productId,
                    variantId: variantId ?? null,
                    stock,
                    note: note?.trim() || null,
                    createdBy: userId,
                }),
            );

            return { ok: true };
        },
    );
