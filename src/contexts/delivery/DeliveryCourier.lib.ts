import 'server-only';

import { db } from '@/infrastructure/database/client';
import { listCourierBalances } from '@/contexts/cashShift/CashShift.lib';
import { courierHandovers } from '@/contexts/cashShift/CashShifts.table';
import type { EmployeeWindow } from '@/contexts/employeeShift/EmployeeShift.types';
import { memberNamesByIds } from '@/contexts/organizationMember/OrganizationMember.lib';
import { PaymentDirection } from '@/contexts/payment/Payment.types';
import { payments } from '@/contexts/payment/Payments.table';
import {
    and,
    asc,
    count,
    eq,
    gte,
    inArray,
    isNotNull,
    lt,
    lte,
    sum,
} from 'drizzle-orm';
import { deliveries } from './Deliveries.table';
import {
    type CourierPeriodView,
    type CourierStatsView,
    DeliveryKind,
    DeliveryStatus,
    IN_WORK_DELIVERY_STATUSES,
    type MyDeliveryView,
} from './Delivery.types';

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
