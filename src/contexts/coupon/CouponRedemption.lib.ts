import 'server-only';

import { db, type Tx } from '@/infrastructure/database/client';
import { ApplicationError } from '@/shared/api/errors';
import { addOrderDiscount } from '@/contexts/order/Order.lib';
import { loadOrderItems } from '@/contexts/order/OrderItem.lib';
import type { OrderRecord } from '@/contexts/order/Orders.table';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { evaluateCoupon } from './Coupon.lib';
import { normalizeCouponCode } from './Coupon.types';
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
