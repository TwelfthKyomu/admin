import 'server-only';

import { db, type Tx } from '@/infrastructure/database/client';
import { refundStripePayment } from '@/infrastructure/payments/stripe';
import { ApplicationError } from '@/shared/api/errors';
import { lockInProject } from '@/shared/api/repository';
import { fmtMoney } from '@/shared/format/money';
import { applyOrderRefund } from '@/contexts/order/OrderPayment.lib';
import type { OrderRecord } from '@/contexts/order/Orders.table';
import {
    foldPaymentTotals,
    PaymentDirection,
    PaymentMethod,
} from '@/contexts/payment/Payment.types';
import { payments } from '@/contexts/payment/Payments.table';
import { and, eq, isNotNull, sum } from 'drizzle-orm';
import { getProviderCredentials } from './PaymentIntent.lib';
import { PaymentIntentStatus } from './PaymentIntent.types';
import {
    type PaymentIntentRecord,
    paymentIntents,
} from './PaymentIntents.table';

async function refundAtProvider(
    intent: PaymentIntentRecord,
    input: { amount: number; reason: string | null; idempotenceKey: string },
): Promise<string> {
    const credentials = await getProviderCredentials(intent.integrationId);

    if (!credentials) {
        throw new ApplicationError(
            'Учётные данные платёжного провайдера не найдены',
        );
    }

    const { providerRefundId } = await refundStripePayment(credentials, {
        intent: {
            id: intent.id,
            amount: intent.amount,
            currency: intent.currency,
            providerPaymentId: intent.providerPaymentId,
            metadata: intent.metadata,
        },
        amount: input.amount,
        reason: input.reason ?? undefined,
        idempotenceKey: input.idempotenceKey,
    });

    return providerRefundId;
}

export async function refundOrderOnline(
    tx: Tx,
    order: OrderRecord,
    input: { amount: number; reason: string | null; recordedBy: string },
): Promise<OrderRecord> {
    const rows = await tx
        .select({
            intentId: payments.sourceIntentId,
            direction: payments.direction,
            total: sum(payments.amount).mapWith(Number),
        })
        .from(payments)
        .where(
            and(
                eq(payments.orderId, order.id),
                isNotNull(payments.sourceIntentId),
            ),
        )
        .groupBy(payments.sourceIntentId, payments.direction);

    const candidates = [
        ...foldPaymentTotals(rows, (row) => row.intentId).entries(),
    ]
        .map(([intentId, totals]) => ({
            intentId,
            refunded: totals.refunded,
            refundable: totals.charged - totals.refunded,
        }))
        .filter((row) => row.refundable > 0);

    if (candidates.length === 0) {
        throw new ApplicationError(
            'У заказа нет онлайн-оплат, которые можно вернуть через провайдера. Выберите другой способ возврата.',
        );
    }

    const target = candidates.find((row) => row.refundable >= input.amount);

    if (!target) {
        const largest = Math.max(...candidates.map((row) => row.refundable));

        throw new ApplicationError(
            `Через провайдера за раз можно вернуть не больше ${fmtMoney(largest, order.currency)} — столько осталось по одному онлайн-платежу. Разбейте возврат на части.`,
        );
    }

    const [intent] = await tx
        .select()
        .from(paymentIntents)
        .where(eq(paymentIntents.id, target.intentId))
        .limit(1);

    if (!intent) throw new ApplicationError('Онлайн-платёж не найден');

    const updated = await applyOrderRefund(tx, order, {
        amount: input.amount,
        method: PaymentMethod.ONLINE,
        reason: input.reason,
        sourceIntentId: intent.id,
        recordedBy: input.recordedBy,
    });

    await refundAtProvider(intent, {
        amount: input.amount,
        reason: input.reason,
        idempotenceKey: `refund:${intent.id}:${target.refunded}:${input.amount}`,
    });

    return updated;
}

export async function refundUnappliedIntent(
    intentId: string,
    projectId: string,
    recordedBy: string,
): Promise<void> {
    await db.transaction(async (tx) => {
        const intent = await lockInProject(
            tx,
            paymentIntents,
            intentId,
            projectId,
            'Онлайн-платёж не найден',
        );

        if (
            intent.status !== PaymentIntentStatus.SUCCEEDED ||
            typeof intent.metadata.applyError !== 'string'
        ) {
            throw new ApplicationError(
                'Вернуть так можно только оплату, которая не зачислилась на заказ',
            );
        }
        if (intent.metadata.refund) {
            throw new ApplicationError('Этот платёж уже возвращён');
        }

        const [applied] = await tx
            .select({ id: payments.id })
            .from(payments)
            .where(
                and(
                    eq(payments.sourceIntentId, intent.id),
                    eq(payments.direction, PaymentDirection.CHARGE),
                ),
            )
            .limit(1);

        if (applied) {
            throw new ApplicationError(
                'Платёж уже зачислен на заказ — оформите возврат по заказу',
            );
        }

        const providerRefundId = await refundAtProvider(intent, {
            amount: intent.amount,
            reason: null,
            idempotenceKey: `refund:${intent.id}:unapplied`,
        });

        await tx
            .update(paymentIntents)
            .set({
                metadata: {
                    ...intent.metadata,
                    refund: {
                        providerRefundId,
                        at: new Date().toISOString(),
                        by: recordedBy,
                    },
                },
            })
            .where(eq(paymentIntents.id, intent.id));
    });
}
