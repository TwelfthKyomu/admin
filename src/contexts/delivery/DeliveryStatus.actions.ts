'use server';

import { db } from '@/infrastructure/database/client';
import { projectMutationAction } from '@/shared/api/action-client';
import { ApplicationError } from '@/shared/api/errors';
import { mailOrderShipped } from '@/contexts/order/OrderMail.lib';
import { Permission } from '@/contexts/user/User.types';
import { after } from 'next/server';
import {
    assignCourier,
    lockCourierDelivery,
    lockDelivery,
    writeDeliveryUpdate,
} from './Delivery.lib';
import {
    AssignDeliveryActionInputSchema,
    DeliveryRefActionInputSchema,
    SetCarrierStatusActionInputSchema,
} from './Delivery.schema';
import { DeliveryKind, DeliveryStatus, isOpenDelivery } from './Delivery.types';

export const assignDeliveryAction = projectMutationAction(
    Permission.MANAGE_DELIVERIES,
)
    .inputSchema(AssignDeliveryActionInputSchema)
    .action(({ parsedInput: { projectId, id, courierId }, ctx: { userId } }) =>
        db.transaction((tx) =>
            assignCourier(tx, {
                id,
                projectId,
                courierId,
                byUserId: userId,
                statuses: [DeliveryStatus.QUEUED, DeliveryStatus.ASSIGNED],
                wrongStatus: 'Курьер уже забрал заказ',
            }),
        ),
    );

export const requeueDeliveryAction = projectMutationAction(
    Permission.MANAGE_DELIVERIES,
)
    .inputSchema(DeliveryRefActionInputSchema)
    .action(({ parsedInput: { projectId, id }, ctx: { userId } }) =>
        db.transaction(async (tx) => {
            const delivery = await lockCourierDelivery(tx, {
                id,
                projectId,
                statuses: [DeliveryStatus.ASSIGNED, DeliveryStatus.FAILED],
                wrongStatus: 'Эту доставку нельзя вернуть в очередь',
            });

            return writeDeliveryUpdate(
                tx,
                delivery,
                {
                    status: DeliveryStatus.QUEUED,
                    courierId: null,
                    assignedAt: null,
                    pickedUpAt: null,
                },
                {
                    byUserId: userId,
                    payload: {
                        from: delivery.status,
                        to: DeliveryStatus.QUEUED,
                    },
                },
            );
        }),
    );

export const cancelDeliveryAction = projectMutationAction(
    Permission.MANAGE_DELIVERIES,
)
    .inputSchema(DeliveryRefActionInputSchema)
    .action(({ parsedInput: { projectId, id }, ctx: { userId } }) =>
        db.transaction(async (tx) => {
            const delivery = await lockDelivery(tx, id, projectId);

            if (!isOpenDelivery(delivery.status)) {
                throw new ApplicationError('Доставка уже закрыта');
            }

            return writeDeliveryUpdate(
                tx,
                delivery,
                { status: DeliveryStatus.CANCELLED, cancelledAt: new Date() },
                {
                    byUserId: userId,
                    payload: {
                        from: delivery.status,
                        to: DeliveryStatus.CANCELLED,
                    },
                },
            );
        }),
    );

export const setCarrierStatusAction = projectMutationAction(
    Permission.MANAGE_DELIVERIES,
)
    .inputSchema(SetCarrierStatusActionInputSchema)
    .action(({ parsedInput: { projectId, id, status }, ctx: { userId } }) =>
        db.transaction(async (tx) => {
            const delivery = await lockDelivery(tx, id, projectId);

            if (delivery.kind !== DeliveryKind.CARRIER) {
                throw new ApplicationError('Это доставка курьером');
            }
            if (delivery.status === DeliveryStatus.CANCELLED) {
                throw new ApplicationError('Доставка отменена');
            }
            if (delivery.status === status) return delivery;

            if (status === DeliveryStatus.PICKED_UP) {
                after(() => mailOrderShipped(delivery.id));
            }

            const now = new Date();

            return writeDeliveryUpdate(
                tx,
                delivery,
                {
                    status,
                    pickedUpAt:
                        status === DeliveryStatus.QUEUED
                            ? null
                            : (delivery.pickedUpAt ?? now),
                    deliveredAt:
                        status === DeliveryStatus.DELIVERED
                            ? (delivery.deliveredAt ?? now)
                            : null,
                },
                {
                    byUserId: userId,
                    payload: { from: delivery.status, to: status },
                },
            );
        }),
    );
