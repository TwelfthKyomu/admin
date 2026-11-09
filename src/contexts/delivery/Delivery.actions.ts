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
import { lockEmployees } from '@/contexts/organizationMember/OrganizationMember.lib';
import {
    DELIVERY_READ_PERMISSIONS,
    ORDER_READ_PERMISSIONS,
    Permission,
} from '@/contexts/user/User.types';
import { eq } from 'drizzle-orm';
import { type DeliveryRecord, deliveries } from './Deliveries.table';
import {
    assertCourierAvailable,
    createDelivery,
    lockDelivery,
    writeDeliveryUpdate,
} from './Delivery.lib';
import {
    CourierStatsActionInputSchema,
    CreateDeliveryActionInputSchema,
    DeliveriesActionInputSchema,
    OrderDeliveryActionInputSchema,
    UpdateDeliveryActionInputSchema,
} from './Delivery.schema';
import {
    assertDeliveryWindow,
    DeliveryKind,
    DeliveryStatus,
    isOpenDelivery,
} from './Delivery.types';
import { loadCourierStats } from './DeliveryCourier.lib';
import { findOrderDelivery, listProjectDeliveries } from './DeliveryList.lib';

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
