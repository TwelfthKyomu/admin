import 'server-only';

import { db, type Reader } from '@/infrastructure/database/client';
import { ApplicationError } from '@/shared/api/errors';
import type { Currency } from '@/shared/constants/currency';
import { ProductType } from '@/contexts/product/Product.types';
import { products, productVariants } from '@/contexts/product/Products.table';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import type { OrderItemInput } from './Order.schema';
import type { ResolvedOrderItem } from './Order.types';
import { type OrderItemRecord, orderItems } from './Orders.table';

export const loadOrderItems = (
    orderId: string,
    executor: Reader = db,
): Promise<OrderItemRecord[]> => {
    return executor
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId));
};

export const resolveOrderItems = async (
    projectId: string,
    items: OrderItemInput[],
    currency: Currency,
): Promise<ResolvedOrderItem[]> => {
    const productIds = [
        ...new Set(items.flatMap((item) => item.productId ?? [])),
    ];

    const [productRows, variantRows] = await Promise.all([
        db
            .select({
                id: products.id,
                type: products.type,
                currency: products.currency,
                costAmount: products.costAmount,
            })
            .from(products)
            .where(
                and(
                    eq(products.projectId, projectId),
                    inArray(products.id, productIds),
                    isNull(products.deletedAt),
                ),
            ),
        db
            .select({
                id: productVariants.id,
                productId: productVariants.productId,
            })
            .from(productVariants)
            .where(
                and(
                    eq(productVariants.projectId, projectId),
                    inArray(productVariants.productId, productIds),
                    eq(productVariants.isActive, true),
                ),
            ),
    ]);

    const productById = new Map(productRows.map((row) => [row.id, row]));

    const productOfVariant = new Map(
        variantRows.map((row) => [row.id, row.productId]),
    );

    const withVariants = new Set(variantRows.map((row) => row.productId));

    return items.map((item) => {
        if (!item.productId) {
            if (item.variantId) {
                throw new ApplicationError(
                    `Вариант позиции «${item.name}» указан без товара`,
                );
            }

            return { ...item, unitCostAmount: null };
        }

        const product = productById.get(item.productId);

        if (!product) {
            throw new ApplicationError(
                `Товар позиции «${item.name}» не найден в проекте`,
            );
        }
        if (product.currency !== currency) {
            throw new ApplicationError(
                `Цена «${item.name}» указана в ${product.currency}, а заказ — в ${currency}. Поменяйте валюту товара.`,
            );
        }
        if (
            item.variantId &&
            productOfVariant.get(item.variantId) !== product.id
        ) {
            throw new ApplicationError(
                `Вариант позиции «${item.name}» не найден у этого товара`,
            );
        }
        if (
            !item.variantId &&
            product.type !== ProductType.SERVICE &&
            withVariants.has(product.id)
        ) {
            throw new ApplicationError(
                `Выберите вариант товара «${item.name}»`,
            );
        }

        return {
            ...item,
            type: product.type,
            unitCostAmount: product.costAmount,
        };
    });
};
