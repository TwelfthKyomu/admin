'use server';

import { db } from '@/infrastructure/database/client';
import { projectMutationAction } from '@/shared/api/action-client';
import { ApplicationError } from '@/shared/api/errors';
import { ownDeliveriesCourierId } from '@/shared/api/permission';
import { findInProject } from '@/shared/api/repository';
import { completeOrder, lockOrder } from '@/contexts/order/Order.lib';
import { isOrderTerminal, orderAmountDue } from '@/contexts/order/Order.types';
import { mailOrderShipped } from '@/contexts/order/OrderMail.lib';
import { applyOrderPayment } from '@/contexts/order/OrderPayment.lib';
import { findMemberIdByUserId } from '@/contexts/organizationMember/OrganizationMember.lib';
import { DELIVERY_PERMISSIONS } from '@/contexts/user/User.types';
import { after } from 'next/server';
import { deliveries } from './Deliveries.table';
import {
    assignCourier,
    lockCourierDelivery,
    writeDeliveryUpdate,
} from './Delivery.lib';
import {
    CompleteDeliveryActionInputSchema,
    DeliveryRefActionInputSchema,
    FailDeliveryActionInputSchema,
} from './Delivery.schema';
import { DeliveryStatus, IN_WORK_DELIVERY_STATUSES } from './Delivery.types';

export const takeDeliveryAction = projectMutationAction(DELIVERY_PERMISSIONS)
    .inputSchema(DeliveryRefActionInputSchema)
    .action(async ({ parsedInput: { projectId, id }, ctx }) => {
        const courierId = await findMemberIdByUserId(
            ctx.organizationId,
            ctx.userId,
        );

        if (!courierId) {
            throw new ApplicationError('Вы не сотрудник этой организации');
        }

        return db.transaction((tx) =>
            assignCourier(tx, {
                id,
                projectId,
                courierId,
                byUserId: ctx.userId,
                statuses: [DeliveryStatus.QUEUED],
                wrongStatus: 'Эту доставку уже взяли',
            }),
        );
    });

export const pickUpDeliveryAction = projectMutationAction(DELIVERY_PERMISSIONS)
    .inputSchema(DeliveryRefActionInputSchema)
    .action(async ({ parsedInput: { projectId, id }, ctx: { userId } }) => {
        const ownCourierId = await ownDeliveriesCourierId(userId, projectId);

        return db.transaction(async (tx) => {
            const delivery = await lockCourierDelivery(tx, {
                id,
                projectId,
                ownCourierId,
                statuses: [DeliveryStatus.ASSIGNED],
                wrongStatus: 'Эта доставка уже в пути или закрыта',
            });

            after(() => mailOrderShipped(delivery.id));

            return writeDeliveryUpdate(
                tx,
                delivery,
                { status: DeliveryStatus.PICKED_UP, pickedUpAt: new Date() },
                {
                    byUserId: userId,
                    payload: {
                        from: delivery.status,
                        to: DeliveryStatus.PICKED_UP,
                    },
                },
            );
        });
    });

export const completeDeliveryAction = projectMutationAction(
    DELIVERY_PERMISSIONS,
)
    .inputSchema(CompleteDeliveryActionInputSchema)
    .action(async ({ parsedInput, ctx: { userId } }) => {
        const { projectId, id, payment } = parsedInput;

        const [ownCourierId, { orderId }] = await Promise.all([
            ownDeliveriesCourierId(userId, projectId),
            findInProject(deliveries, id, projectId, 'Доставка не найдена'),
        ]);

        return db.transaction(async (tx) => {
            let order = await lockOrder(tx, orderId, projectId);

            const delivery = await lockCourierDelivery(tx, {
                id,
                projectId,
                ownCourierId,
                statuses: IN_WORK_DELIVERY_STATUSES,
                wrongStatus: 'Доставка не в работе',
            });

            if (delivery.cashDue > 0 && !payment) {
                throw new ApplicationError('Нужно принять оплату у двери');
            }

            if (payment) {
                if (payment.amount > orderAmountDue(order)) {
                    throw new ApplicationError(
                        'Сумма больше остатка по заказу',
                    );
                }

                order = await applyOrderPayment(tx, order, {
                    amount: payment.amount,
                    method: payment.method,
                    collectedByEmployeeId: delivery.courierId,
                    recordedBy: userId,
                });
            }

            const now = new Date();

            const delivered = await writeDeliveryUpdate(
                tx,
                delivery,
                {
                    status: DeliveryStatus.DELIVERED,
                    deliveredAt: now,
                    pickedUpAt: delivery.pickedUpAt ?? now,
                },
                {
                    byUserId: userId,
                    payload: {
                        from: delivery.status,
                        to: DeliveryStatus.DELIVERED,
                        collected: payment?.amount ?? 0,
                    },
                },
            );

            if (!isOrderTerminal(order.status)) {
                await completeOrder(tx, order, {
                    byUserId: userId,
                    reason: 'Заказ доставлен',
                });
            }

            return delivered;
        });
    });

export const failDeliveryAction = projectMutationAction(DELIVERY_PERMISSIONS)
    .inputSchema(FailDeliveryActionInputSchema)
    .action(async ({ parsedInput, ctx: { userId } }) => {
        const { projectId, id, reason } = parsedInput;
        const ownCourierId = await ownDeliveriesCourierId(userId, projectId);

        return db.transaction(async (tx) => {
            const delivery = await lockCourierDelivery(tx, {
                id,
                projectId,
                ownCourierId,
                statuses: IN_WORK_DELIVERY_STATUSES,
                wrongStatus: 'Доставка не в работе',
            });

            return writeDeliveryUpdate(
                tx,
                delivery,
                {
                    status: DeliveryStatus.FAILED,
                    failedAt: new Date(),
                    failureReason: reason,
                },
                {
                    byUserId: userId,
                    payload: {
                        from: delivery.status,
                        to: DeliveryStatus.FAILED,
                        reason,
                    },
                },
            );
        });
    });
