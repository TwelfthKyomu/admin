'use server';

import { db } from '@/infrastructure/database/client';
import {
    projectMutationAction,
    projectReadAction,
} from '@/shared/api/action-client';
import { ApplicationError } from '@/shared/api/errors';
import { visibleSalesEmployeeId } from '@/shared/api/permission';
import { searchFilters } from '@/shared/api/repository';
import { DURATION_MINUTES_MAX } from '@/shared/constants/default';
import { findClientInProject } from '@/contexts/client/Client.lib';
import { findOrderCouponCode } from '@/contexts/coupon/Coupon.lib';
import { assertActiveAssignments } from '@/contexts/employeeAssignment/EmployeeAssignment.lib';
import {
    findMemberIdByUserId,
    lockEmployees,
    memberNamesByIds,
} from '@/contexts/organizationMember/OrganizationMember.lib';
import { projectDefaultCurrency } from '@/contexts/project/Project.lib';
import { ORDER_READ_PERMISSIONS, Permission } from '@/contexts/user/User.types';
import { and, asc, desc, eq, gte, inArray, lt } from 'drizzle-orm';
import {
    createOrderWithItems,
    findOrderInProject,
    loadOrderItems,
    resolveOrderItems,
} from './Order.lib';
import {
    CreateOrderActionInputSchema,
    EmployeeRevenueActionInputSchema,
    OrderDetailActionInputSchema,
    OrdersActionInputSchema,
} from './Order.schema';
import {
    type EmployeeRevenueView,
    inferDurationMinutes,
    maskSeller,
    ORDERS_LIST_LIMIT,
    ORDERS_RANGE_LIMIT,
    OrderType,
    orderRequiresSchedule,
    sumOrderItems,
} from './Order.types';
import { assertBookingFeasible } from './OrderBooking.lib';
import { aggregateSellerRevenue } from './OrderStats.lib';
import { orderEvents, orders } from './Orders.table';

export const ordersAction = projectReadAction(ORDER_READ_PERMISSIONS)
    .inputSchema(OrdersActionInputSchema)
    .action(async ({ parsedInput, ctx: { userId } }) => {
        const { projectId, ...options } = parsedInput;
        const ownEmployeeId = await visibleSalesEmployeeId(userId, projectId);
        const filters = [eq(orders.projectId, projectId)];

        if (options.types && options.types.length > 0) {
            filters.push(inArray(orders.type, options.types));
        }
        if (options.statuses && options.statuses.length > 0) {
            filters.push(inArray(orders.status, options.statuses));
        }
        if (options.from) filters.push(gte(orders.scheduledAt, options.from));
        if (options.to) filters.push(lt(orders.scheduledAt, options.to));
        if (options.clientId) {
            filters.push(eq(orders.clientId, options.clientId));
        }
        if (options.assignedEmployeeId) {
            filters.push(
                eq(orders.assignedEmployeeId, options.assignedEmployeeId),
            );
        }
        if (options.sellerId && !ownEmployeeId) {
            filters.push(eq(orders.sellerId, options.sellerId));
        }

        filters.push(
            ...searchFilters(options.search, [
                orders.id,
                orders.customerName,
                orders.customerPhone,
                orders.customerEmail,
                orders.notes,
            ]),
        );

        const rows = await db
            .select()
            .from(orders)
            .where(and(...filters))
            .orderBy(desc(orders.createdAt))
            .limit(
                options.from && options.to
                    ? ORDERS_RANGE_LIMIT
                    : ORDERS_LIST_LIMIT,
            );

        return rows.map((order) => maskSeller(order, ownEmployeeId));
    });

export const orderDetailAction = projectReadAction(ORDER_READ_PERMISSIONS)
    .inputSchema(OrderDetailActionInputSchema)
    .action(async ({ parsedInput: { id, projectId }, ctx: { userId } }) => {
        const [order, ownEmployeeId, items, events, couponCode] =
            await Promise.all([
                findOrderInProject(id, projectId),
                visibleSalesEmployeeId(userId, projectId),
                loadOrderItems(id),
                db
                    .select()
                    .from(orderEvents)
                    .where(eq(orderEvents.orderId, id))
                    .orderBy(asc(orderEvents.createdAt)),
                findOrderCouponCode(id),
            ]);

        return {
            order: maskSeller(order, ownEmployeeId),
            items,
            events,
            couponCode,
        };
    });

export const employeeRevenueAction = projectReadAction(Permission.VIEW_FINANCES)
    .inputSchema(EmployeeRevenueActionInputSchema)
    .action(async ({ parsedInput: { projectId, from, to } }) => {
        const rows = await aggregateSellerRevenue(projectId, from, to);
        const bySeller = new Map<string | null, EmployeeRevenueView>();

        const nameById = await memberNamesByIds(
            rows.map((row) => row.sellerId).filter((id) => id !== null),
        );

        for (const row of rows) {
            const current = bySeller.get(row.sellerId) ?? {
                employeeId: row.sellerId,
                employeeName: row.sellerId
                    ? (nameById.get(row.sellerId) ?? 'Удалённый сотрудник')
                    : 'Без продавца',
                ordersCount: 0,
                revenueAmount: 0,
            };

            current.ordersCount += row.ordersCount;
            current.revenueAmount += row.revenueAmount;
            bySeller.set(row.sellerId, current);
        }

        return [...bySeller.values()].sort(
            (a, b) => b.revenueAmount - a.revenueAmount,
        );
    });

export const createOrderAction = projectMutationAction(Permission.MANAGE_ORDERS)
    .inputSchema(CreateOrderActionInputSchema)
    .action(async ({ parsedInput, ctx: { userId, organizationId } }) => {
        const { projectId } = parsedInput;
        const inputItems = parsedInput.items ?? [];
        const assignedEmployeeId = parsedInput.assignedEmployeeId ?? null;
        const scheduledAt = parsedInput.scheduledAt ?? null;
        const requiresSchedule = orderRequiresSchedule(parsedInput.type);

        if (requiresSchedule) {
            if (!scheduledAt) {
                throw new ApplicationError('Для записи нужна дата и время');
            }
            if (scheduledAt.getTime() < Date.now()) {
                throw new ApplicationError(
                    'Нельзя создать запись на прошедшее время',
                );
            }
        }
        if (parsedInput.type === OrderType.BOOKING && !assignedEmployeeId) {
            throw new ApplicationError('Для записи нужен исполнитель');
        }

        const [currency, sellerId] = await Promise.all([
            parsedInput.currency ?? projectDefaultCurrency(projectId),
            findMemberIdByUserId(organizationId, userId),
            parsedInput.clientId
                ? findClientInProject(parsedInput.clientId, projectId)
                : null,
        ]);

        const [items] = await Promise.all([
            resolveOrderItems(projectId, inputItems, currency),
            assertActiveAssignments(projectId, [
                assignedEmployeeId,
                ...inputItems.map((item) => item.performerEmployeeId),
            ]),
        ]);

        const durationMinutes =
            parsedInput.durationMinutes ?? inferDurationMinutes(items);

        if (parsedInput.type === OrderType.BOOKING && !durationMinutes) {
            throw new ApplicationError(
                'Для записи нужна длительность: укажите её или добавьте услугу с длительностью',
            );
        }
        if (durationMinutes && durationMinutes > DURATION_MINUTES_MAX) {
            throw new ApplicationError('Запись не может длиться дольше суток');
        }

        const subtotalAmount = sumOrderItems(items);
        const discountAmount = parsedInput.discountAmount ?? 0;

        if (discountAmount > subtotalAmount) {
            throw new ApplicationError(
                'Скидка не может превышать сумму позиций',
            );
        }

        const booking =
            requiresSchedule &&
            assignedEmployeeId &&
            scheduledAt &&
            durationMinutes
                ? { assignedEmployeeId, scheduledAt, durationMinutes }
                : null;

        return db.transaction(async (tx) => {
            if (booking) {
                await lockEmployees(tx, [booking.assignedEmployeeId]);

                await assertBookingFeasible(tx, {
                    projectId,
                    ...booking,
                    items,
                });
            }

            const { order } = await createOrderWithItems(
                tx,
                {
                    projectId,
                    organizationId,
                    type: parsedInput.type,
                    clientId: parsedInput.clientId ?? null,
                    customerName: parsedInput.customerName?.trim() || null,
                    customerPhone: parsedInput.customerPhone?.trim() || null,
                    customerEmail:
                        parsedInput.customerEmail?.trim().toLowerCase() || null,
                    assignedEmployeeId,
                    scheduledAt,
                    durationMinutes,
                    sellerId,
                    soldAt: new Date(),
                    currency,
                    subtotalAmount,
                    discountAmount,
                    totalAmount: subtotalAmount - discountAmount,
                    notes: parsedInput.notes ?? null,
                },
                items,
                { byUserId: userId },
            );

            return order;
        });
    });
