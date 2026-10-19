'use server';

import { db } from '@/infrastructure/database/client';
import { projectMutationAction } from '@/shared/api/action-client';
import { ApplicationError } from '@/shared/api/errors';
import { assertFullBookingsAccess } from '@/shared/api/permission';
import { reverseCouponRedemptionsForOrder } from '@/contexts/coupon/Coupon.lib';
import { cancelActiveDelivery } from '@/contexts/delivery/Delivery.lib';
import { assertActiveAssignments } from '@/contexts/employeeAssignment/EmployeeAssignment.lib';
import { lockEmployees } from '@/contexts/organizationMember/OrganizationMember.lib';
import { applyStockReturn } from '@/contexts/stockMovement/StockMovement.lib';
import { ORDER_PERMISSIONS } from '@/contexts/user/User.types';
import {
    changeOrderStatus,
    loadOrderItems,
    lockOwnOrder,
    setOrderAssignedEmployee,
    writeOrderUpdate,
} from './Order.lib';
import {
    ChangeOrderScheduleActionInputSchema,
    ChangeOrderStatusActionInputSchema,
} from './Order.schema';
import {
    isOrderCancelled,
    isOrderTerminal,
    OrderEventType,
    OrderType,
    orderRequiresSchedule,
} from './Order.types';
import { assertBookingFeasible } from './OrderBooking.lib';

export const changeOrderStatusAction = projectMutationAction(ORDER_PERMISSIONS)
    .inputSchema(ChangeOrderStatusActionInputSchema)
    .action(({ parsedInput, ctx: { userId } }) =>
        db.transaction(async (tx) => {
            const order = await lockOwnOrder(
                tx,
                userId,
                parsedInput.id,
                parsedInput.projectId,
            );

            if (isOrderTerminal(order.status)) {
                throw new ApplicationError('Заказ уже в финальном статусе');
            }

            const next = parsedInput.nextStatus;

            const row = await changeOrderStatus(tx, order, next, {
                byUserId: userId,
                reason: parsedInput.reason?.trim() || null,
            });

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
    ORDER_PERMISSIONS,
)
    .inputSchema(ChangeOrderScheduleActionInputSchema)
    .action(async ({ parsedInput, ctx: { userId } }) => {
        const { projectId, scheduledAt, durationMinutes } = parsedInput;
        const nextEmployeeId = parsedInput.assignedEmployeeId;

        if (nextEmployeeId) {
            await assertActiveAssignments(projectId, [nextEmployeeId]);
        }

        return db.transaction(async (tx) => {
            const order = await lockOwnOrder(
                tx,
                userId,
                parsedInput.id,
                projectId,
            );

            if (isOrderTerminal(order.status)) {
                throw new ApplicationError(
                    'Нельзя перенести завершённый заказ',
                );
            }

            const reassigning =
                nextEmployeeId !== undefined &&
                nextEmployeeId !== order.assignedEmployeeId;

            if (reassigning) await assertFullBookingsAccess(userId, projectId);

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
