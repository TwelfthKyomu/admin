import 'server-only';

import { db, type Reader, type Tx } from '@/infrastructure/database/client';
import { ApplicationError } from '@/shared/api/errors';
import { insertOne, lockInProject } from '@/shared/api/repository';
import { PAGE_SIZE_HUGE } from '@/shared/constants/default';
import { listCourierBalances } from '@/contexts/cashShift/CashShift.lib';
import { courierHandovers } from '@/contexts/cashShift/CashShifts.table';
import { findActiveAssignment } from '@/contexts/employeeAssignment/EmployeeAssignment.lib';
import { EmployeeKind } from '@/contexts/employeeAssignment/EmployeeAssignment.types';
import { isCoveredByShift } from '@/contexts/employeeShift/EmployeeShift.lib';
import type { EmployeeWindow } from '@/contexts/employeeShift/EmployeeShift.types';
import { recordOrderEvents } from '@/contexts/order/Order.lib';
import { OrderEventType, orderAmountDue } from '@/contexts/order/Order.types';
import { orders } from '@/contexts/order/Orders.table';
import {
    lockEmployees,
    memberNamesByIds,
} from '@/contexts/organizationMember/OrganizationMember.lib';
import { organizationMembers } from '@/contexts/organizationMember/OrganizationMembers.table';
import { PaymentDirection } from '@/contexts/payment/Payment.types';
import { payments } from '@/contexts/payment/Payments.table';
import { users } from '@/contexts/user/Users.table';
import {
    and,
    asc,
    count,
    desc,
    eq,
    gte,
    inArray,
    isNotNull,
    isNull,
    lt,
    lte,
    or,
    type SQL,
    sum,
} from 'drizzle-orm';
import type { PgColumn } from 'drizzle-orm/pg-core';
import {
    type DeliveryRecord,
    deliveries,
    type NewDeliveryRecord,
} from './Deliveries.table';
import {
    type CourierPeriodView,
    type CourierStatsView,
    DeliveryKind,
    DeliveryStatus,
    type DeliveryView,
    deliveryTimeOf,
    IN_WORK_DELIVERY_STATUSES,
    type MyDeliveryView,
    OPEN_DELIVERY_STATUSES,
} from './Delivery.types';

interface DeliveryEvent {
    byUserId: string | null;
    payload: Record<string, unknown>;
}

export function lockDelivery(
    tx: Tx,
    id: string,
    projectId: string,
): Promise<DeliveryRecord> {
    return lockInProject(tx, deliveries, id, projectId, 'Доставка не найдена');
}

export async function lockCourierDelivery(
    tx: Tx,
    input: {
        id: string;
        projectId: string;
        statuses: readonly DeliveryStatus[];
        wrongStatus: string;
        ownCourierId?: string | null;
    },
): Promise<DeliveryRecord> {
    const delivery = await lockDelivery(tx, input.id, input.projectId);

    if (delivery.kind !== DeliveryKind.COURIER) {
        throw new ApplicationError('Это доставка службой, а не курьером');
    }
    if (input.ownCourierId && delivery.courierId !== input.ownCourierId) {
        throw new ApplicationError('Это доставка другого курьера');
    }
    if (!input.statuses.includes(delivery.status)) {
        throw new ApplicationError(input.wrongStatus);
    }

    return delivery;
}

export async function assertCourierAvailable(
    tx: Tx,
    window: EmployeeWindow,
): Promise<void> {
    const assignment = await findActiveAssignment(
        window.employeeId,
        window.projectId,
        tx,
    );

    if (!assignment) {
        throw new ApplicationError('Курьер не работает в этом проекте');
    }
    if (assignment.kind !== EmployeeKind.COURIER) {
        throw new ApplicationError('Этот сотрудник не курьер');
    }
    if (!(await isCoveredByShift(tx, window))) {
        throw new ApplicationError('У курьера нет смены на это время');
    }
}

function deliveryEvent(orderId: string, event: DeliveryEvent) {
    return {
        orderId,
        type: OrderEventType.SHIPMENT_UPDATED,
        byUserId: event.byUserId,
        payload: { delivery: event.payload },
    };
}

export async function createDelivery(
    tx: Tx,
    values: NewDeliveryRecord,
    byUserId: string,
): Promise<DeliveryRecord> {
    const created = await insertOne(
        deliveries,
        values,
        'Не удалось создать доставку',
        tx,
    );

    await recordOrderEvents(tx, [
        deliveryEvent(created.orderId, {
            byUserId,
            payload: { created: created.kind, status: created.status },
        }),
    ]);

    return created;
}

export async function writeDeliveryUpdate(
    tx: Tx,
    delivery: DeliveryRecord,
    values: Partial<DeliveryRecord>,
    event: DeliveryEvent,
): Promise<DeliveryRecord> {
    const [updated] = await tx
        .update(deliveries)
        .set(values)
        .where(eq(deliveries.id, delivery.id))
        .returning();

    if (!updated) throw new ApplicationError('Доставка не найдена');

    await recordOrderEvents(tx, [deliveryEvent(delivery.orderId, event)]);

    return updated;
}

export async function assignCourier(
    tx: Tx,
    input: {
        id: string;
        projectId: string;
        courierId: string;
        byUserId: string;
        statuses: readonly DeliveryStatus[];
        wrongStatus: string;
    },
): Promise<DeliveryRecord> {
    await lockEmployees(tx, [input.courierId]);

    const delivery = await lockCourierDelivery(tx, input);

    if (!delivery.windowStart || !delivery.windowEnd) {
        throw new ApplicationError('У доставки не указано окно');
    }

    await assertCourierAvailable(tx, {
        employeeId: input.courierId,
        projectId: input.projectId,
        startsAt: delivery.windowStart,
        endsAt: delivery.windowEnd,
    });

    return writeDeliveryUpdate(
        tx,
        delivery,
        {
            status: DeliveryStatus.ASSIGNED,
            courierId: input.courierId,
            assignedAt: new Date(),
        },
        {
            byUserId: input.byUserId,
            payload: {
                courier: { from: delivery.courierId, to: input.courierId },
            },
        },
    );
}

export async function hasOpenDelivery(
    executor: Reader,
    orderId: string,
): Promise<boolean> {
    const [delivery] = await executor
        .select({ id: deliveries.id })
        .from(deliveries)
        .where(
            and(
                eq(deliveries.orderId, orderId),
                inArray(deliveries.status, OPEN_DELIVERY_STATUSES),
            ),
        )
        .limit(1);

    return delivery !== undefined;
}

export async function cancelActiveDelivery(
    tx: Tx,
    orderId: string,
    byUserId: string | null,
): Promise<void> {
    const [delivery] = await tx
        .select()
        .from(deliveries)
        .where(
            and(
                eq(deliveries.orderId, orderId),
                inArray(deliveries.status, OPEN_DELIVERY_STATUSES),
            ),
        )
        .limit(1)
        .for('update');

    if (!delivery) return;

    await writeDeliveryUpdate(
        tx,
        delivery,
        { status: DeliveryStatus.CANCELLED, cancelledAt: new Date() },
        {
            byUserId,
            payload: { from: delivery.status, to: DeliveryStatus.CANCELLED },
        },
    );
}

export async function moveCourierDeliveries(
    tx: Tx,
    window: EmployeeWindow & { toEmployeeId: string; byUserId: string },
): Promise<number> {
    const moved = await tx
        .update(deliveries)
        .set({ courierId: window.toEmployeeId, assignedAt: new Date() })
        .where(
            and(
                eq(deliveries.projectId, window.projectId),
                eq(deliveries.courierId, window.employeeId),
                eq(deliveries.status, DeliveryStatus.ASSIGNED),
                gte(deliveries.windowStart, window.startsAt),
                lte(deliveries.windowEnd, window.endsAt),
            ),
        )
        .returning({ orderId: deliveries.orderId });

    await recordOrderEvents(
        tx,
        moved.map((delivery) =>
            deliveryEvent(delivery.orderId, {
                byUserId: window.byUserId,
                payload: {
                    courier: {
                        from: window.employeeId,
                        to: window.toEmployeeId,
                    },
                },
            }),
        ),
    );

    return moved.length;
}

async function selectDeliveries(
    where: SQL | undefined,
    limit: number,
): Promise<DeliveryView[]> {
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
}

export function listProjectDeliveries(
    projectId: string,
    options: { visibleCourierId: string | null; from?: Date; to?: Date },
): Promise<DeliveryView[]> {
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
}

export async function findOrderDelivery(
    orderId: string,
    projectId: string,
): Promise<DeliveryView | null> {
    const [delivery] = await selectDeliveries(
        and(
            eq(deliveries.orderId, orderId),
            eq(deliveries.projectId, projectId),
        ),
        1,
    );

    return delivery ?? null;
}

export async function aggregateDeliveredByCourier(
    projectId: string,
    from: Date,
    to: Date,
): Promise<{ courierId: string; count: number }[]> {
    const rows = await db
        .select({ courierId: deliveries.courierId, count: count() })
        .from(deliveries)
        .where(
            and(
                eq(deliveries.projectId, projectId),
                eq(deliveries.kind, DeliveryKind.COURIER),
                eq(deliveries.status, DeliveryStatus.DELIVERED),
                gte(deliveries.deliveredAt, from),
                lt(deliveries.deliveredAt, to),
            ),
        )
        .groupBy(deliveries.courierId);

    return rows.flatMap((row) =>
        row.courierId ? [{ courierId: row.courierId, count: row.count }] : [],
    );
}

export async function loadCourierStats(
    projectId: string,
    from: Date,
    to: Date,
): Promise<CourierStatsView[]> {
    const [delivered, failed, collected, handedOver, balances] =
        await Promise.all([
            aggregateDeliveredByCourier(projectId, from, to),
            db
                .select({ courierId: deliveries.courierId, count: count() })
                .from(deliveries)
                .where(
                    and(
                        eq(deliveries.projectId, projectId),
                        eq(deliveries.kind, DeliveryKind.COURIER),
                        gte(deliveries.failedAt, from),
                        lt(deliveries.failedAt, to),
                    ),
                )
                .groupBy(deliveries.courierId),
            db
                .select({
                    courierId: payments.collectedByEmployeeId,
                    count: sum(payments.amount).mapWith(Number),
                })
                .from(payments)
                .where(
                    and(
                        eq(payments.projectId, projectId),
                        eq(payments.direction, PaymentDirection.CHARGE),
                        isNotNull(payments.collectedByEmployeeId),
                        gte(payments.occurredAt, from),
                        lt(payments.occurredAt, to),
                    ),
                )
                .groupBy(payments.collectedByEmployeeId),
            db
                .select({
                    courierId: courierHandovers.employeeId,
                    count: sum(courierHandovers.amount).mapWith(Number),
                })
                .from(courierHandovers)
                .where(
                    and(
                        eq(courierHandovers.projectId, projectId),
                        gte(courierHandovers.occurredAt, from),
                        lt(courierHandovers.occurredAt, to),
                    ),
                )
                .groupBy(courierHandovers.employeeId),
            listCourierBalances(projectId),
        ]);

    const empty: CourierPeriodView = {
        delivered: 0,
        failed: 0,
        collected: 0,
        handedOver: 0,
    };

    const period = new Map<string, CourierPeriodView>();

    const fill = (
        rows: { courierId: string | null; count: number }[],
        field: keyof CourierPeriodView,
    ) => {
        for (const row of rows) {
            if (!row.courierId) continue;

            const current = period.get(row.courierId) ?? { ...empty };

            current[field] = row.count;
            period.set(row.courierId, current);
        }
    };

    fill(delivered, 'delivered');
    fill(failed, 'failed');
    fill(collected, 'collected');
    fill(handedOver, 'handedOver');

    const onHand = new Map(balances.map((row) => [row.employeeId, row.onHand]));
    const ids = [...new Set([...period.keys(), ...onHand.keys()])];
    const names = await memberNamesByIds(ids);

    return ids
        .map((employeeId) => ({
            ...(period.get(employeeId) ?? empty),
            employeeId,
            name: names.get(employeeId) ?? 'Удалённый сотрудник',
            onHand: onHand.get(employeeId) ?? 0,
        }))
        .sort((a, b) => b.delivered - a.delivered);
}

export async function courierLoadInWindow(
    window: EmployeeWindow,
): Promise<{ count: number; cashDue: number }> {
    const [row] = await db
        .select({ count: count(), cashDue: sum(deliveries.cashDue) })
        .from(deliveries)
        .where(
            and(
                eq(deliveries.projectId, window.projectId),
                eq(deliveries.courierId, window.employeeId),
                eq(deliveries.status, DeliveryStatus.ASSIGNED),
                gte(deliveries.windowStart, window.startsAt),
                lte(deliveries.windowEnd, window.endsAt),
            ),
        );

    return { count: row?.count ?? 0, cashDue: Number(row?.cashDue ?? 0) };
}

export function listCourierDeliveriesInWork(
    courierId: string,
): Promise<MyDeliveryView[]> {
    return db
        .select({
            id: deliveries.id,
            projectId: deliveries.projectId,
            orderId: deliveries.orderId,
            status: deliveries.status,
            windowStart: deliveries.windowStart,
            windowEnd: deliveries.windowEnd,
            address: deliveries.address,
            recipientName: deliveries.recipientName,
        })
        .from(deliveries)
        .where(
            and(
                eq(deliveries.courierId, courierId),
                inArray(deliveries.status, IN_WORK_DELIVERY_STATUSES),
            ),
        )
        .orderBy(asc(deliveries.windowStart));
}
