import 'server-only';

import type { Tx } from '@/infrastructure/database/client';
import type { ProductType } from '@/contexts/product/Product.types';
import { products, productVariants } from '@/contexts/product/Products.table';
import { and, eq, isNull } from 'drizzle-orm';
import type { StockTarget } from './StockMovement.types';

export interface LockedStock {
    stock: number | null;
    type: ProductType;
    name: string;
}

export const lockStock = async (
    tx: Tx,
    target: StockTarget,
): Promise<LockedStock | undefined> => {
    if (target.variantId) {
        const [variant] = await tx
            .select({
                stock: productVariants.stock,
                type: products.type,
                name: products.name,
            })
            .from(productVariants)
            .innerJoin(products, eq(products.id, productVariants.productId))
            .where(
                and(
                    eq(productVariants.id, target.variantId),
                    eq(productVariants.productId, target.productId),
                    eq(productVariants.projectId, target.projectId),
                ),
            )
            .limit(1)
            .for('update', { of: productVariants });

        return variant;
    }

    const [product] = await tx
        .select({
            stock: products.stock,
            type: products.type,
            name: products.name,
        })
        .from(products)
        .where(
            and(
                eq(products.id, target.productId),
                eq(products.projectId, target.projectId),
                isNull(products.deletedAt),
            ),
        )
        .limit(1)
        .for('update');

    return product;
};

export const setStock = async (
    tx: Tx,
    target: StockTarget,
    stock: number | null,
): Promise<void> => {
    if (target.variantId) {
        await tx
            .update(productVariants)
            .set({ stock })
            .where(eq(productVariants.id, target.variantId));

        return;
    }

    await tx
        .update(products)
        .set({ stock })
        .where(eq(products.id, target.productId));
};
