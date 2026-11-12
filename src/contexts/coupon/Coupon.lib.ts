import 'server-only';

import { db, type Reader } from '@/infrastructure/database/client';
import { ApplicationError } from '@/shared/api/errors';
import type {
    OrderItemRecord,
    OrderRecord,
} from '@/contexts/order/Orders.table';
import { products } from '@/contexts/product/Products.table';
import { projectCategories } from '@/contexts/projectCategory/ProjectCategories.table';
import { findCategoryDescendantIds } from '@/contexts/projectCategory/ProjectCategory.lib';
import { and, count, eq, inArray, isNull } from 'drizzle-orm';
import {
    assertCouponRedeemable,
    type CouponScope,
    computeDiscount,
    normalizeCouponCode,
    splitCouponScope,
} from './Coupon.types';
import { type CouponRecord, couponRedemptions, coupons } from './Coupons.table';

export const assertScopeInProject = async (
    projectId: string,
    scope: CouponScope | undefined,
): Promise<void> => {
    const { productIds, categoryIds } = splitCouponScope(scope);

    if (productIds.length === 0 && categoryIds.length === 0) return;

    const [foundProducts, foundCategories] = await Promise.all([
        db
            .select({ id: products.id })
            .from(products)
            .where(
                and(
                    eq(products.projectId, projectId),
                    inArray(products.id, productIds),
                    isNull(products.deletedAt),
                ),
            ),
        db
            .select({ id: projectCategories.id })
            .from(projectCategories)
            .where(
                and(
                    eq(projectCategories.projectId, projectId),
                    inArray(projectCategories.id, categoryIds),
                    isNull(projectCategories.deletedAt),
                ),
            ),
    ]);

    if (
        foundProducts.length < new Set(productIds).size ||
        foundCategories.length < new Set(categoryIds).size
    ) {
        throw new ApplicationError(
            'В условиях купона есть товар или категория не из этого проекта',
        );
    }
};

const eligibleSubtotal = async (
    scope: CouponScope,
    items: Pick<OrderItemRecord, 'productId' | 'totalAmount'>[],
): Promise<number> => {
    const { productIds, categoryIds } = splitCouponScope(scope);

    if (productIds.length === 0 && categoryIds.length === 0) {
        return items.reduce((sum, item) => sum + item.totalAmount, 0);
    }

    const [descendantIds, productRows] = await Promise.all([
        findCategoryDescendantIds(categoryIds),
        db
            .select({ id: products.id, categoryId: products.categoryId })
            .from(products)
            .where(
                inArray(
                    products.id,
                    items.flatMap((item) => item.productId ?? []),
                ),
            ),
    ]);

    const eligibleProducts = new Set(productIds);
    const eligibleCategories = new Set([...categoryIds, ...descendantIds]);

    const categoryOf = new Map(
        productRows.map((row) => [row.id, row.categoryId]),
    );

    return items
        .filter((item) => {
            if (!item.productId) return false;

            const categoryId = categoryOf.get(item.productId);

            return (
                eligibleProducts.has(item.productId) ||
                (categoryId !== undefined &&
                    categoryId !== null &&
                    eligibleCategories.has(categoryId))
            );
        })
        .reduce((sum, item) => sum + item.totalAmount, 0);
};

const assertClientLimit = async (
    reader: Reader,
    coupon: CouponRecord,
    clientId: string | null,
): Promise<void> => {
    if (coupon.maxUsesPerClient === null || !clientId) return;

    const [row] = await reader
        .select({ value: count() })
        .from(couponRedemptions)
        .where(
            and(
                eq(couponRedemptions.couponId, coupon.id),
                eq(couponRedemptions.clientId, clientId),
            ),
        );

    if ((row?.value ?? 0) >= coupon.maxUsesPerClient) {
        throw new ApplicationError(
            'Достигнут лимит применений купона для этого клиента',
        );
    }
};

export const evaluateCoupon = async (
    reader: Reader,
    coupon: CouponRecord,
    order: Pick<OrderRecord, 'subtotalAmount' | 'discountAmount' | 'clientId'>,
    items: Pick<OrderItemRecord, 'productId' | 'totalAmount'>[],
): Promise<number> => {
    assertCouponRedeemable(coupon, new Date());

    if (
        coupon.minOrderAmount !== null &&
        order.subtotalAmount < coupon.minOrderAmount
    ) {
        throw new ApplicationError(
            'Сумма заказа меньше минимальной для этого купона',
        );
    }

    await assertClientLimit(reader, coupon, order.clientId);

    const subtotal = await eligibleSubtotal(coupon.scope, items);

    if (subtotal === 0) {
        throw new ApplicationError(
            'Купон не применим ни к одной позиции заказа',
        );
    }

    const discountAmount = Math.min(
        computeDiscount(coupon, subtotal),
        order.subtotalAmount - order.discountAmount,
    );

    if (discountAmount <= 0) {
        throw new ApplicationError('Рассчитанная скидка равна нулю');
    }

    return discountAmount;
};

export const previewCoupon = async (
    projectId: string,
    rawCode: string,
    items: Pick<OrderItemRecord, 'productId' | 'totalAmount'>[],
): Promise<number> => {
    const [coupon] = await db
        .select()
        .from(coupons)
        .where(
            and(
                eq(coupons.projectId, projectId),
                eq(coupons.code, normalizeCouponCode(rawCode)),
                isNull(coupons.deletedAt),
            ),
        )
        .limit(1);

    if (!coupon) throw new ApplicationError('Промокод не найден');

    return evaluateCoupon(
        db,
        coupon,
        {
            subtotalAmount: items.reduce(
                (sum, item) => sum + item.totalAmount,
                0,
            ),
            discountAmount: 0,
            clientId: null,
        },
        items,
    );
};
