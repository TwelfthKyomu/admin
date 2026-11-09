'use server';

import { db } from '@/infrastructure/database/client';
import { projectReadAction } from '@/shared/api/action-client';
import { PAGE_SIZE_LARGE } from '@/shared/constants/default';
import { variantComboLabel } from '@/contexts/product/Product.types';
import { products } from '@/contexts/product/Products.table';
import { loadVariants } from '@/contexts/product/ProductVariant.lib';
import { CATALOG_READ_PERMISSIONS } from '@/contexts/user/User.types';
import { loadWarehouseQuantities } from '@/contexts/warehouse/Warehouse.lib';
import { and, asc, desc, eq, isNull } from 'drizzle-orm';
import {
    StockMovementsActionInputSchema,
    StockOverviewActionInputSchema,
} from './StockMovement.schema';
import { type StockLevelView, stockKey } from './StockMovement.types';
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

        const [variantsByProduct, quantities] = await Promise.all([
            loadVariants(rows.map((row) => row.id)),
            loadWarehouseQuantities(projectId),
        ]);

        const byWarehouse = new Map<string, Record<string, number>>();

        for (const row of quantities) {
            const key = stockKey(row);

            byWarehouse.set(key, {
                ...byWarehouse.get(key),
                [row.warehouseId]: row.quantity,
            });
        }

        return rows.flatMap<StockLevelView>((row) => {
            const variants = variantsByProduct.get(row.id) ?? [];

            if (variants.length === 0) {
                return [
                    {
                        ...row,
                        productId: row.id,
                        variantId: null,
                        byWarehouse: byWarehouse.get(row.id) ?? {},
                    },
                ];
            }

            return variants.map((variant) => ({
                id: `${row.id}:${variant.id}`,
                productId: row.id,
                variantId: variant.id,
                name: `${row.name} (${variantComboLabel(variant.optionValues)})`,
                sku: variant.sku ?? row.sku,
                type: row.type,
                stock: variant.stock,
                byWarehouse: byWarehouse.get(variant.id) ?? {},
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
