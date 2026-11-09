import 'server-only';

import type { Reader, Tx } from '@/infrastructure/database/client';
import { ApplicationError } from '@/shared/api/errors';
import { insertOne, lockInProject } from '@/shared/api/repository';
import { findActiveAssignment } from '@/contexts/employeeAssignment/EmployeeAssignment.lib';
import { EmployeeKind } from '@/contexts/employeeAssignment/EmployeeAssignment.types';
import { isCoveredByShift } from '@/contexts/employeeShift/EmployeeShift.lib';
import type { EmployeeWindow } from '@/contexts/employeeShift/EmployeeShift.types';
import { recordOrderEvents } from '@/contexts/order/Order.lib';
import { OrderEventType } from '@/contexts/order/Order.types';
import { lockEmployees } from '@/contexts/organizationMember/OrganizationMember.lib';
import { and, eq, gte, inArray, lte } from 'drizzle-orm';
import {
    type DeliveryRecord,
    deliveries,
    type NewDeliveryRecord,
} from './Deliveries.table';
import {
    DeliveryKind,
    DeliveryStatus,
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
