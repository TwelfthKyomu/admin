'use server';

import { db } from '@/infrastructure/database/client';
import { projectMutationAction } from '@/shared/api/action-client';
import { ApplicationError } from '@/shared/api/errors';
import { reverseCouponRedemptionsForOrder } from '@/contexts/coupon/Coupon.lib';
import { cancelActiveDelivery } from '@/contexts/delivery/Delivery.lib';
import { assertActiveAssignments } from '@/contexts/employeeAssignment/EmployeeAssignment.lib';
import {
    findMemberIdByUserId,
    lockEmployees,
} from '@/contexts/organizationMember/OrganizationMember.lib';
import { applyStockReturn } from '@/contexts/stockMovement/StockMovement.lib';
import { Permission } from '@/contexts/user/User.types';
import {
    changeOrderStatus,
    loadOrderItems,
    lockOrder,
    setOrderAssignedEmployee,
    setOrderSeller,
    writeOrderUpdate,
} from './Order.lib';
import {
    ChangeOrderScheduleActionInputSchema,
    ChangeOrderStatusActionInputSchema,
} from './Order.schema';
import {
    confirmationSeller,
    isOrderCancelled,
    isOrderTerminal,
    OrderEventType,
    OrderStatus,
    OrderType,
    orderRequiresSchedule,
} from './Order.types';
import { assertBookingFeasible } from './OrderBooking.lib';

export const changeOrderStatusAction = projectMutationAction(
    Permission.MANAGE_ORDERS,
)
    .inputSchema(ChangeOrderStatusActionInputSchema)
    .action(({ parsedInput, ctx: { userId, organizationId } }) =>
        db.transaction(async (tx) => {
            const order = await lockOrder(
                tx,
                parsedInput.id,
                parsedInput.projectId,
            );

            if (isOrderTerminal(order.status)) {
                throw new ApplicationError('Заказ уже в финальном статусе');
            }

            const next = parsedInput.nextStatus;

            const changed = await changeOrderStatus(tx, order, next, {
                byUserId: userId,
                reason: parsedInput.reason?.trim() || null,
            });

            const sellerId =
                next === OrderStatus.CONFIRMED
                    ? confirmationSeller(
                          changed,
                          await findMemberIdByUserId(organizationId, userId),
                      )
                    : changed.sellerId;

            const row =
                sellerId === changed.sellerId
                    ? changed
                    : await setOrderSeller(tx, changed, sellerId, userId);

            if (isOrderCancelled(next)) {
                await reverseCouponRedemptionsForOrder(tx, order.id);

                await applyStockReturn(tx, {
                    orderId: order.id,
                    projectId: order.projectId,
                    createdBy: userId,
                });

                await cancelActiveDelivery(tx, order.id, userId);
            }

            return row;
        }),
    );

export const changeOrderScheduleAction = projectMutationAction(
    Permission.MANAGE_ORDERS,
)
    .inputSchema(ChangeOrderScheduleActionInputSchema)
    .action(async ({ parsedInput, ctx: { userId } }) => {
        const { projectId, scheduledAt, durationMinutes } = parsedInput;
        const nextEmployeeId = parsedInput.assignedEmployeeId;

        if (nextEmployeeId) {
            await assertActiveAssignments(projectId, [nextEmployeeId]);
        }

        return db.transaction(async (tx) => {
            const order = await lockOrder(tx, parsedInput.id, projectId);

            if (isOrderTerminal(order.status)) {
                throw new ApplicationError(
                    'Нельзя перенести завершённый заказ',
                );
            }

            const reassigning =
                nextEmployeeId !== undefined &&
                nextEmployeeId !== order.assignedEmployeeId;

            const employeeId = reassigning
                ? nextEmployeeId
                : order.assignedEmployeeId;

            if (orderRequiresSchedule(order.type)) {
                if (!scheduledAt) {
                    throw new ApplicationError(
                        'У записи нельзя убрать дату и время — перенесите её или отмените заказ',
                    );
                }
                if (scheduledAt.getTime() < Date.now()) {
                    throw new ApplicationError(
                        'Нельзя перенести запись на прошедшее время',
                    );
                }
            }
            if (order.type === OrderType.BOOKING && !durationMinutes) {
                throw new ApplicationError('У записи должна быть длительность');
            }

            if (
                orderRequiresSchedule(order.type) &&
                scheduledAt &&
                durationMinutes &&
                employeeId
            ) {
                await lockEmployees(tx, [employeeId]);

                await assertBookingFeasible(tx, {
                    projectId: order.projectId,
                    assignedEmployeeId: employeeId,
                    scheduledAt,
                    durationMinutes,
                    items: await loadOrderItems(order.id, tx),
                    excludeOrderId: order.id,
                });
            }

            const assigned = reassigning
                ? await setOrderAssignedEmployee(tx, order, employeeId, userId)
                : order;

            return writeOrderUpdate(
                tx,
                assigned,
                { scheduledAt, durationMinutes, reminderSentAt: null },
                {
                    type: OrderEventType.SCHEDULED_AT_CHANGED,
                    byUserId: userId,
                    payload: {
                        from: {
                            scheduledAt: order.scheduledAt,
                            durationMinutes: order.durationMinutes,
                        },
                        to: { scheduledAt, durationMinutes },
                    },
                },
            );
        });
    });
