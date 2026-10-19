'use server';

import { db } from '@/infrastructure/database/client';
import {
    projectMutationAction,
    projectReadAction,
} from '@/shared/api/action-client';
import { ApplicationError } from '@/shared/api/errors';
import { visibleDeliveriesCourierId } from '@/shared/api/permission';
import { findOrderInProject, lockOrder } from '@/contexts/order/Order.lib';
import {
    isOrderCancelled,
    isOrderTerminal,
    orderAmountDue,
} from '@/contexts/order/Order.types';
import { mailOrderShipped } from '@/contexts/order/OrderMail.lib';
import { lockEmployees } from '@/contexts/organizationMember/OrganizationMember.lib';
import {
    DELIVERY_READ_PERMISSIONS,
    ORDER_READ_PERMISSIONS,
    Permission,
} from '@/contexts/user/User.types';
import { eq } from 'drizzle-orm';
import { after } from 'next/server';
import { type DeliveryRecord, deliveries } from './Deliveries.table';
import {
    assertCourierAvailable,
    assignCourier,
    createDelivery,
    findOrderDelivery,
    listProjectDeliveries,
    loadCourierStats,
    lockCourierDelivery,
    lockDelivery,
    writeDeliveryUpdate,
} from './Delivery.lib';
import {
    AssignDeliveryActionInputSchema,
    CourierStatsActionInputSchema,
    CreateDeliveryActionInputSchema,
    DeliveriesActionInputSchema,
    DeliveryRefActionInputSchema,
    OrderDeliveryActionInputSchema,
    SetCarrierStatusActionInputSchema,
    UpdateDeliveryActionInputSchema,
} from './Delivery.schema';
import {
    assertDeliveryWindow,
    DeliveryKind,
    DeliveryStatus,
    isOpenDelivery,
} from './Delivery.types';

export const deliveriesAction = projectReadAction(DELIVERY_READ_PERMISSIONS)
    .inputSchema(DeliveriesActionInputSchema)
    .action(async ({ parsedInput: { projectId, from, to }, ctx: { userId } }) =>
        listProjectDeliveries(projectId, {
            visibleCourierId: await visibleDeliveriesCourierId(
                userId,
                projectId,
            ),
            from,
            to,
        }),
    );

export const courierStatsAction = projectReadAction(Permission.VIEW_FINANCES)
    .inputSchema(CourierStatsActionInputSchema)
    .action(({ parsedInput: { projectId, from, to } }) =>
        loadCourierStats(projectId, from, to),
    );

export const orderDeliveryAction = projectReadAction(ORDER_READ_PERMISSIONS)
    .inputSchema(OrderDeliveryActionInputSchema)
    .action(({ parsedInput: { projectId, orderId } }) =>
        findOrderDelivery(orderId, projectId),
    );

export const createDeliveryAction = projectMutationAction(
    Permission.MANAGE_DELIVERIES,
)
    .inputSchema(CreateDeliveryActionInputSchema)
    .action(({ parsedInput, ctx: { userId } }) =>
        db.transaction(async (tx) => {
            const order = await lockOrder(
                tx,
                parsedInput.orderId,
                parsedInput.projectId,
            );

            if (isOrderCancelled(order.status)) {
                throw new ApplicationError('Заказ отменён');
            }

            const [existing] = await tx
                .select({ id: deliveries.id })
                .from(deliveries)
                .where(eq(deliveries.orderId, order.id))
                .limit(1);

            if (existing) {
                throw new ApplicationError('У заказа уже есть доставка');
            }

            const base = {
                projectId: order.projectId,
                organizationId: order.organizationId,
                orderId: order.id,
            };

            if (parsedInput.kind === DeliveryKind.CARRIER) {
                return createDelivery(
                    tx,
                    {
                        ...base,
                        kind: DeliveryKind.CARRIER,
                        status: DeliveryStatus.QUEUED,
                        carrier: parsedInput.carrier,
                        trackingNumber: parsedInput.trackingNumber,
                        address: parsedInput.address || null,
                    },
                    userId,
                );
            }

            if (isOrderTerminal(order.status)) {
                throw new ApplicationError('Заказ уже закрыт');
            }

            assertDeliveryWindow(
                parsedInput.windowStart,
                parsedInput.windowEnd,
            );

            const due = orderAmountDue(order);
            const cashDue = parsedInput.cashDue ?? due;

            if (cashDue > due) {
                throw new ApplicationError(
                    'Сумма у двери больше остатка по заказу',
                );
            }

            const courierId = parsedInput.courierId ?? null;

            if (courierId) {
                await lockEmployees(tx, [courierId]);

                await assertCourierAvailable(tx, {
                    employeeId: courierId,
                    projectId: order.projectId,
                    startsAt: parsedInput.windowStart,
                    endsAt: parsedInput.windowEnd,
                });
            }

            return createDelivery(
                tx,
                {
                    ...base,
                    kind: DeliveryKind.COURIER,
                    status: courierId
                        ? DeliveryStatus.ASSIGNED
                        : DeliveryStatus.QUEUED,
                    courierId,
                    assignedAt: courierId ? new Date() : null,
                    address: parsedInput.address,
                    recipientName: parsedInput.recipientName || null,
                    recipientPhone: parsedInput.recipientPhone || null,
                    windowStart: parsedInput.windowStart,
                    windowEnd: parsedInput.windowEnd,
                    cashDue,
                },
                userId,
            );
        }),
    );

export const updateDeliveryAction = projectMutationAction(
    Permission.MANAGE_DELIVERIES,
)
    .inputSchema(UpdateDeliveryActionInputSchema)
    .action(({ parsedInput, ctx: { userId } }) =>
        db.transaction(async (tx) => {
            const { projectId, id } = parsedInput;
            const current = await lockDelivery(tx, id, projectId);

            if (!isOpenDelivery(current.status)) {
                throw new ApplicationError('Закрытую доставку менять нельзя');
            }

            const values: Partial<DeliveryRecord> = {};

            if (parsedInput.address !== undefined) {
                values.address = parsedInput.address || null;
            }
            if (parsedInput.recipientName !== undefined) {
                values.recipientName = parsedInput.recipientName || null;
            }
            if (parsedInput.recipientPhone !== undefined) {
                values.recipientPhone = parsedInput.recipientPhone || null;
            }

            if (current.kind === DeliveryKind.CARRIER) {
                if (parsedInput.carrier !== undefined) {
                    values.carrier = parsedInput.carrier;
                }
                if (parsedInput.trackingNumber !== undefined) {
                    values.trackingNumber = parsedInput.trackingNumber;
                }
            } else {
                values.windowStart =
                    parsedInput.windowStart ?? current.windowStart;

                values.windowEnd = parsedInput.windowEnd ?? current.windowEnd;

                if (values.windowStart && values.windowEnd) {
                    assertDeliveryWindow(values.windowStart, values.windowEnd);
                }

                if (parsedInput.cashDue !== undefined) {
                    const order = await findOrderInProject(
                        current.orderId,
                        projectId,
                    );

                    if (parsedInput.cashDue > orderAmountDue(order)) {
                        throw new ApplicationError(
                            'Сумма у двери больше остатка по заказу',
                        );
                    }

                    values.cashDue = parsedInput.cashDue;
                }

                const windowChanged =
                    values.windowStart?.getTime() !==
                        current.windowStart?.getTime() ||
                    values.windowEnd?.getTime() !==
                        current.windowEnd?.getTime();

                if (
                    windowChanged &&
                    current.courierId &&
                    values.windowStart &&
                    values.windowEnd
                ) {
                    await lockEmployees(tx, [current.courierId]);

                    await assertCourierAvailable(tx, {
                        employeeId: current.courierId,
                        projectId,
                        startsAt: values.windowStart,
                        endsAt: values.windowEnd,
                    });
                }
            }

            return writeDeliveryUpdate(tx, current, values, {
                byUserId: userId,
                payload: { updated: Object.keys(values) },
            });
        }),
    );

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
