'use server';

import { db } from '@/infrastructure/database/client';
import { projectMutationAction } from '@/shared/api/action-client';
import { PaymentMethod } from '@/contexts/payment/Payment.types';
import { refundOrderOnline } from '@/contexts/paymentIntent/PaymentIntentRefund.lib';
import { Permission } from '@/contexts/user/User.types';
import { lockOrder } from './Order.lib';
import {
    RecordOrderPaymentActionInputSchema,
    RecordOrderRefundActionInputSchema,
} from './Order.schema';
import { applyOrderPayment, applyOrderRefund } from './OrderPayment.lib';

export const recordOrderPaymentAction = projectMutationAction(
    Permission.MANAGE_FINANCES,
)
    .inputSchema(RecordOrderPaymentActionInputSchema)
    .action(({ parsedInput, ctx: { userId } }) =>
        db.transaction(async (tx) => {
            const order = await lockOrder(
                tx,
                parsedInput.id,
                parsedInput.projectId,
            );

            return applyOrderPayment(tx, order, {
                amount: parsedInput.amount,
                method: parsedInput.method ?? null,
                recordedBy: userId,
            });
        }),
    );

export const recordOrderRefundAction = projectMutationAction(
    Permission.MANAGE_FINANCES,
    'payment:refund',
)
    .inputSchema(RecordOrderRefundActionInputSchema)
    .action(({ parsedInput, ctx: { userId } }) =>
        db.transaction(async (tx) => {
            const order = await lockOrder(
                tx,
                parsedInput.id,
                parsedInput.projectId,
            );

            if (parsedInput.method === PaymentMethod.ONLINE) {
                return refundOrderOnline(tx, order, {
                    amount: parsedInput.amount,
                    reason: parsedInput.reason ?? null,
                    recordedBy: userId,
                });
            }

            return applyOrderRefund(tx, order, {
                amount: parsedInput.amount,
                method: parsedInput.method ?? null,
                reason: parsedInput.reason ?? null,
                recordedBy: userId,
            });
        }),
    );
