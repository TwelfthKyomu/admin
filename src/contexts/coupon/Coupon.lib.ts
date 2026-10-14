import 'server-only';

import { db, type Reader, type Tx } from '@/infrastructure/database/client';
import { ApplicationError } from '@/shared/api/errors';
import { addOrderDiscount, loadOrderItems } from '@/contexts/order/Order.lib';
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

async function lockCoupons(
    tx: Tx,
    where: ReturnType<typeof and>,
): Promise<CouponRecord[]> {
    return tx.select().from(coupons).where(where).for('update');
}

async function setCouponUses(
    tx: Tx,
    coupon: Pick<CouponRecord, 'id'>,
    usesCount: number,
): Promise<void> {
    await tx
        .update(coupons)
        .set({ usesCount: Math.max(usesCount, 0) })
        .where(eq(coupons.id, coupon.id));
}

export async function reverseCouponRedemptionsForOrder(
    tx: Tx,
    orderId: string,
): Promise<void> {
    const deleted = await tx
        .delete(couponRedemptions)
        .where(eq(couponRedemptions.orderId, orderId))
        .returning({ couponId: couponRedemptions.couponId });

    if (deleted.length === 0) return;

    const locked = await lockCoupons(
        tx,
        inArray(
            coupons.id,
            deleted.map((row) => row.couponId),
        ),
    );

    for (const coupon of locked) {
        await setCouponUses(tx, coupon, coupon.usesCount - 1);
    }
}

export async function assertScopeInProject(
    projectId: string,
    scope: CouponScope | undefined,
): Promise<void> {
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
}

async function eligibleSubtotal(
    scope: CouponScope,
    items: Pick<OrderItemRecord, 'productId' | 'totalAmount'>[],
): Promise<number> {
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
}

async function assertClientLimit(
    reader: Reader,
    coupon: CouponRecord,
    clientId: string | null,
): Promise<void> {
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
}

export async function findOrderCouponCode(
    orderId: string,
): Promise<string | null> {
    const [row] = await db
        .select({ code: coupons.code })
        .from(couponRedemptions)
        .innerJoin(coupons, eq(coupons.id, couponRedemptions.couponId))
        .where(eq(couponRedemptions.orderId, orderId))
        .limit(1);

    return row?.code ?? null;
}

async function evaluateCoupon(
    reader: Reader,
    coupon: CouponRecord,
    order: Pick<OrderRecord, 'subtotalAmount' | 'discountAmount' | 'clientId'>,
    items: Pick<OrderItemRecord, 'productId' | 'totalAmount'>[],
): Promise<number> {
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
}

export async function previewCoupon(
    projectId: string,
    rawCode: string,
    items: Pick<OrderItemRecord, 'productId' | 'totalAmount'>[],
): Promise<number> {
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
}

export async function redeemCoupon(
    tx: Tx,
    order: OrderRecord,
    rawCode: string,
    byUserId: string | null,
): Promise<{ order: OrderRecord; discountAmount: number }> {
    if (order.paidAmount > 0) {
        throw new ApplicationError(
            'Промокод применяется только до оплаты заказа',
        );
    }

    const [coupon] = await lockCoupons(
        tx,
        and(
            eq(coupons.projectId, order.projectId),
            eq(coupons.code, normalizeCouponCode(rawCode)),
            isNull(coupons.deletedAt),
        ),
    );

    if (!coupon) throw new ApplicationError('Купон не найден');

    const [redeemed] = await tx
        .select({ couponId: couponRedemptions.couponId })
        .from(couponRedemptions)
        .where(eq(couponRedemptions.orderId, order.id))
        .limit(1);

    if (redeemed) {
        throw new ApplicationError(
            redeemed.couponId === coupon.id
                ? 'Этот купон уже применён к данному заказу'
                : 'К заказу уже применён другой купон',
        );
    }

    const discountAmount = await evaluateCoupon(
        tx,
        coupon,
        order,
        await loadOrderItems(order.id, tx),
    );

    await tx.insert(couponRedemptions).values({
        couponId: coupon.id,
        orderId: order.id,
        projectId: order.projectId,
        clientId: order.clientId,
        amount: discountAmount,
    });

    await setCouponUses(tx, coupon, coupon.usesCount + 1);

    return {
        order: await addOrderDiscount(tx, order, discountAmount, byUserId),
        discountAmount,
    };
}
