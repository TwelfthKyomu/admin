import 'server-only';

import { db } from '@/infrastructure/database/client';
import { PAGE_SIZE_HUGE } from '@/shared/constants/default';
import { orderAmountDue } from '@/contexts/order/Order.types';
import { orders } from '@/contexts/order/Orders.table';
import { organizationMembers } from '@/contexts/organizationMember/OrganizationMembers.table';
import { users } from '@/contexts/user/Users.table';
import {
    and,
    desc,
    eq,
    gte,
    inArray,
    isNull,
    lt,
    or,
    type SQL,
} from 'drizzle-orm';
import type { PgColumn } from 'drizzle-orm/pg-core';
import { deliveries } from './Deliveries.table';
import {
    DeliveryKind,
    DeliveryStatus,
    type DeliveryView,
    deliveryTimeOf,
    OPEN_DELIVERY_STATUSES,
} from './Delivery.types';

const selectDeliveries = async (
    where: SQL | undefined,
    limit: number,
): Promise<DeliveryView[]> => {
    const rows = await db
        .select({
            delivery: deliveries,
            courierName: users.name,
            order: {
                customerName: orders.customerName,
                currency: orders.currency,
                totalAmount: orders.totalAmount,
                paidAmount: orders.paidAmount,
                refundedAmount: orders.refundedAmount,
            },
        })
        .from(deliveries)
        .innerJoin(orders, eq(orders.id, deliveries.orderId))
        .leftJoin(
            organizationMembers,
            eq(organizationMembers.id, deliveries.courierId),
        )
        .leftJoin(users, eq(users.id, organizationMembers.userId))
        .where(where)
        .orderBy(desc(deliveries.createdAt))
        .limit(limit);

    return rows
        .map(({ delivery, courierName, order }) => ({
            ...delivery,
            courierName,
            customerName: order.customerName,
            currency: order.currency,
            amountDue: orderAmountDue(order),
        }))
        .sort(
            (a, b) =>
                deliveryTimeOf(a).getTime() - deliveryTimeOf(b).getTime() ||
                b.createdAt.getTime() - a.createdAt.getTime(),
        );
};

export const listProjectDeliveries = (
    projectId: string,
    options: { visibleCourierId: string | null; from?: Date; to?: Date },
): Promise<DeliveryView[]> => {
    const inPeriod = (column: PgColumn) =>
        and(
            options.from ? gte(column, options.from) : undefined,
            options.to ? lt(column, options.to) : undefined,
        );

    return selectDeliveries(
        and(
            eq(deliveries.projectId, projectId),
            options.visibleCourierId
                ? or(
                      eq(deliveries.courierId, options.visibleCourierId),
                      and(
                          eq(deliveries.status, DeliveryStatus.QUEUED),
                          eq(deliveries.kind, DeliveryKind.COURIER),
                      ),
                  )
                : undefined,
            options.from || options.to
                ? or(
                      inArray(deliveries.status, OPEN_DELIVERY_STATUSES),
                      inPeriod(deliveries.windowStart),
                      and(
                          isNull(deliveries.windowStart),
                          inPeriod(deliveries.createdAt),
                      ),
                  )
                : undefined,
        ),
        PAGE_SIZE_HUGE,
    );
};

export const findOrderDelivery = async (
    orderId: string,
    projectId: string,
): Promise<DeliveryView | null> => {
    const [delivery] = await selectDeliveries(
        and(
            eq(deliveries.orderId, orderId),
            eq(deliveries.projectId, projectId),
        ),
        1,
    );

    return delivery ?? null;
};
