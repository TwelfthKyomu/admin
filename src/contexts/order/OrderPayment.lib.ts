import 'server-only';

import type { Tx } from '@/infrastructure/database/client';
import { ApplicationError } from '@/shared/api/errors';
import { lockOpenCashShift } from '@/contexts/cashShift/CashShift.lib';
import { addClientSpending } from '@/contexts/client/Client.lib';
import {
    PaymentDirection,
    PaymentMethod,
} from '@/contexts/payment/Payment.types';
import {
    type NewPaymentRecord,
    payments,
} from '@/contexts/payment/Payments.table';
import {
    applyStockReturn,
    applyStockSale,
} from '@/contexts/stockMovement/StockMovement.lib';
import { loadOrderItems, writeOrderUpdate } from './Order.lib';
import {
    isOrderCancelled,
    OrderEventType,
    OrderStatus,
    orderAfterPayment,
    orderAfterRefund,
    PaymentStatus,
    stockLinesFromOrderItems,
} from './Order.types';
import type { OrderRecord } from './Orders.table';

export type OrderPaymentInput = Pick<
    NewPaymentRecord,
    'amount' | 'method' | 'reason' | 'sourceIntentId' | 'collectedByEmployeeId'
> & { recordedBy: string | null };

async function insertPayment(
    tx: Tx,
    order: OrderRecord,
    direction: PaymentDirection,
    input: OrderPaymentInput,
): Promise<void> {
    const intoRegister =
        input.method === PaymentMethod.CASH && !input.collectedByEmployeeId;

    const cashShift = intoRegister
        ? await lockOpenCashShift(
              tx,
              order.projectId,
              'share',
              'Наличные в кассе принимаются только в открытую смену. Откройте её на странице «Касса».',
          )
        : null;

    await tx.insert(payments).values({
        ...input,
        projectId: order.projectId,
        orderId: order.id,
        direction,
        cashShiftId: cashShift?.id ?? null,
    });
}

export async function applyOrderPayment(
    tx: Tx,
    order: OrderRecord,
    input: OrderPaymentInput,
): Promise<OrderRecord> {
    if (isOrderCancelled(order.status)) {
        throw new ApplicationError(
            'Нельзя провести оплату по отменённому заказу',
        );
    }
    if (order.paymentStatus === PaymentStatus.REFUNDED) {
        throw new ApplicationError(
            'Заказ полностью возвращён — новую оплату оформите новым заказом',
        );
    }

    const money = orderAfterPayment(order, input.amount);

    const updated = await writeOrderUpdate(tx, order, money, {
        type: OrderEventType.PAYMENT_RECORDED,
        byUserId: input.recordedBy,
        payload: {
            amount: input.amount,
            method: input.method ?? null,
            paymentStatus: money.paymentStatus,
        },
    });

    await insertPayment(tx, order, PaymentDirection.CHARGE, input);

    if (money.paymentStatus === PaymentStatus.PAID) {
        await applyStockSale(tx, {
            orderId: order.id,
            projectId: order.projectId,
            createdBy: input.recordedBy,
            lines: stockLinesFromOrderItems(await loadOrderItems(order.id, tx)),
        });
    }

    return updated;
}

export async function applyOrderRefund(
    tx: Tx,
    order: OrderRecord,
    input: OrderPaymentInput,
): Promise<OrderRecord> {
    const money = orderAfterRefund(order, input.amount);

    const updated = await writeOrderUpdate(tx, order, money, {
        type: OrderEventType.REFUND_RECORDED,
        byUserId: input.recordedBy,
        payload: {
            amount: input.amount,
            method: input.method ?? null,
            reason: input.reason ?? null,
            paymentStatus: money.paymentStatus,
        },
    });

    await insertPayment(tx, order, PaymentDirection.REFUND, input);

    if (order.clientId && order.status === OrderStatus.COMPLETED) {
        await addClientSpending(tx, order.clientId, {
            orders: 0,
            amount: -input.amount,
        });
    }

    if (money.paymentStatus === PaymentStatus.REFUNDED) {
        await applyStockReturn(tx, {
            orderId: order.id,
            projectId: order.projectId,
            createdBy: input.recordedBy,
        });
    }

    return updated;
}
