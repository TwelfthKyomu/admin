import 'server-only';

import { db, type Tx } from '@/infrastructure/database/client';
import type { ManualStockChange } from '@/contexts/stockMovement/StockMovement.types';
import { and, asc, eq, inArray, notInArray } from 'drizzle-orm';
import type { ProductRef } from './Product.types';
import {
    type NewProductVariantRecord,
    type ProductVariantRecord,
    productVariants,
} from './Products.table';

export async function saveProductVariants(
    tx: Tx,
    product: ProductRef,
    records: NewProductVariantRecord[],
    existing: ProductVariantRecord[],
    createdBy: string,
): Promise<ManualStockChange[]> {
    const keptIds = records.flatMap((record) => record.id ?? []);
    const added = records.filter((record) => record.id === undefined);

    if (existing.length > 0) {
        await tx
            .delete(productVariants)
            .where(
                and(
                    eq(productVariants.productId, product.id),
                    keptIds.length > 0
                        ? notInArray(productVariants.id, keptIds)
                        : undefined,
                ),
            );
    }

    const stockBefore = new Map(
        existing.map((variant) => [variant.id, variant.stock]),
    );

    const saved: Pick<ProductVariantRecord, 'id' | 'stock'>[] = [];

    for (const { id, ...record } of records) {
        if (id === undefined) continue;

        const [row] = await tx
            .update(productVariants)
            .set(record)
            .where(
                and(
                    eq(productVariants.id, id),
                    eq(productVariants.productId, product.id),
                ),
            )
            .returning({
                id: productVariants.id,
                stock: productVariants.stock,
            });

        if (row) saved.push(row);
    }

    if (added.length > 0) {
        saved.push(
            ...(await tx.insert(productVariants).values(added).returning({
                id: productVariants.id,
                stock: productVariants.stock,
            })),
        );
    }

    return saved.map((variant) => {
        const before = stockBefore.get(variant.id) ?? null;

        return {
            projectId: product.projectId,
            productId: product.id,
            variantId: variant.id,
            before,
            after: variant.stock,
            note: before === null ? 'Начальный остаток варианта' : null,
            createdBy,
        };
    });
}

export async function loadVariants(
    productIds: string[],
): Promise<Map<string, ProductVariantRecord[]>> {
    const rows = await db
        .select()
        .from(productVariants)
        .where(inArray(productVariants.productId, productIds))
        .orderBy(asc(productVariants.position));

    return Map.groupBy(rows, (row) => row.productId);
}
