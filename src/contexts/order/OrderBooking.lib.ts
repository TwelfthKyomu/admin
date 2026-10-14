import 'server-only';

import { db, type Reader } from '@/infrastructure/database/client';
import { ApplicationError } from '@/shared/api/errors';
import { DURATION_MINUTES_MAX } from '@/shared/constants/default';
import { getErrorMessage } from '@/shared/lib/errors';
import { findActiveAssignment } from '@/contexts/employeeAssignment/EmployeeAssignment.lib';
import { EmployeeKind } from '@/contexts/employeeAssignment/EmployeeAssignment.types';
import {
    covers,
    type EmployeeWindow,
    WORKING_SHIFT_STATUSES,
} from '@/contexts/employeeShift/EmployeeShift.types';
import {
    type EmployeeShiftRecord,
    employeeShifts,
} from '@/contexts/employeeShift/EmployeeShifts.table';
import { lockEmployees } from '@/contexts/organizationMember/OrganizationMember.lib';
import { ProductType } from '@/contexts/product/Product.types';
import { productPerformers } from '@/contexts/product/Products.table';
import { addMinutes } from 'date-fns';
import { and, asc, eq, gt, gte, inArray, lt, lte, ne } from 'drizzle-orm';
import {
    loadOrderItems,
    lockOrder,
    setOrderAssignedEmployee,
} from './Order.lib';
import type { OrderItemInput } from './Order.schema';
import {
    bookingEndsAt,
    type MyBookingView,
    ORDER_ACTIVE_STATUSES,
} from './Order.types';
import { type OrderRecord, orders } from './Orders.table';

interface Booking {
    projectId: string;
    assignedEmployeeId: string;
    scheduledAt: Date;
    durationMinutes: number;
    items: Pick<OrderItemInput, 'productId' | 'name' | 'type'>[];
    excludeOrderId?: string;
}

export async function findEmployeeBookings(
    executor: Reader,
    window: Omit<EmployeeWindow, 'projectId'> & {
        projectId?: string;
        excludeOrderId?: string;
    },
): Promise<OrderRecord[]> {
    const rows = await executor
        .select()
        .from(orders)
        .where(
            and(
                eq(orders.assignedEmployeeId, window.employeeId),
                window.projectId
                    ? eq(orders.projectId, window.projectId)
                    : undefined,
                window.excludeOrderId
                    ? ne(orders.id, window.excludeOrderId)
                    : undefined,
                inArray(orders.status, ORDER_ACTIVE_STATUSES),
                lt(orders.scheduledAt, window.endsAt),
                gt(
                    orders.scheduledAt,
                    addMinutes(window.startsAt, -DURATION_MINUTES_MAX),
                ),
            ),
        )
        .orderBy(asc(orders.scheduledAt));

    return rows.filter(
        (order) =>
            order.scheduledAt !== null &&
            order.durationMinutes !== null &&
            bookingEndsAt(order.scheduledAt, order.durationMinutes) >
                window.startsAt,
    );
}

export async function listEmployeeBookings(
    employeeId: string,
    from: Date,
    to: Date,
): Promise<MyBookingView[]> {
    const bookings = await findEmployeeBookings(db, {
        employeeId,
        startsAt: from,
        endsAt: to,
    });

    return bookings.map((booking) => ({
        id: booking.id,
        projectId: booking.projectId,
        scheduledAt: booking.scheduledAt,
        durationMinutes: booking.durationMinutes,
        customerName: booking.customerName,
        status: booking.status,
    }));
}

export async function isCoveredByShift(
    executor: Reader,
    window: EmployeeWindow,
): Promise<boolean> {
    const [shift] = await executor
        .select({ id: employeeShifts.id })
        .from(employeeShifts)
        .where(
            and(
                eq(employeeShifts.employeeId, window.employeeId),
                eq(employeeShifts.projectId, window.projectId),
                inArray(employeeShifts.status, WORKING_SHIFT_STATUSES),
                lte(employeeShifts.startsAt, window.startsAt),
                gte(employeeShifts.endsAt, window.endsAt),
            ),
        )
        .limit(1);

    return shift !== undefined;
}

export async function findBookingsLosingShiftCoverage(
    shift: Pick<EmployeeShiftRecord, 'id'> & EmployeeWindow,
): Promise<OrderRecord[]> {
    const [bookings, otherShifts] = await Promise.all([
        findEmployeeBookings(db, shift),
        db
            .select({
                startsAt: employeeShifts.startsAt,
                endsAt: employeeShifts.endsAt,
            })
            .from(employeeShifts)
            .where(
                and(
                    eq(employeeShifts.employeeId, shift.employeeId),
                    eq(employeeShifts.projectId, shift.projectId),
                    inArray(employeeShifts.status, WORKING_SHIFT_STATUSES),
                    ne(employeeShifts.id, shift.id),
                    lt(employeeShifts.startsAt, shift.endsAt),
                    gt(employeeShifts.endsAt, shift.startsAt),
                ),
            ),
    ]);

    return bookings.filter((order) => {
        if (!order.scheduledAt || !order.durationMinutes) return false;

        const booking = {
            startsAt: order.scheduledAt,
            endsAt: bookingEndsAt(order.scheduledAt, order.durationMinutes),
        };

        return !otherShifts.some((other) => covers(other, booking));
    });
}

async function assertBookableEmployee(
    executor: Reader,
    booking: Booking,
): Promise<void> {
    const assignment = await findActiveAssignment(
        booking.assignedEmployeeId,
        booking.projectId,
        executor,
    );

    if (!assignment) {
        throw new ApplicationError(
            'У выбранного сотрудника нет активного назначения на этот проект',
        );
    }
    if (assignment.kind === EmployeeKind.COURIER) {
        throw new ApplicationError('Курьера нельзя записать на услугу');
    }
    if (!assignment.isBookable) {
        throw new ApplicationError('Этот сотрудник не принимает записи');
    }
}

async function assertAllowedPerformer(
    executor: Reader,
    booking: Booking,
): Promise<void> {
    const services = booking.items.filter(
        (item) => item.type === ProductType.SERVICE && item.productId,
    );

    if (services.length === 0) return;

    const performers = await executor
        .select({
            productId: productPerformers.productId,
            employeeId: productPerformers.employeeId,
        })
        .from(productPerformers)
        .where(
            and(
                eq(productPerformers.projectId, booking.projectId),
                inArray(
                    productPerformers.productId,
                    services.flatMap((item) => item.productId ?? []),
                ),
            ),
        );

    for (const item of services) {
        const allowed = performers.filter(
            (row) => row.productId === item.productId,
        );

        const isPerformer = allowed.some(
            (row) => row.employeeId === booking.assignedEmployeeId,
        );

        if (allowed.length > 0 && !isPerformer) {
            throw new ApplicationError(
                `Сотрудник не входит в список исполнителей услуги «${item.name}»`,
            );
        }
    }
}

async function assertFreeWindow(
    executor: Reader,
    booking: Booking,
): Promise<void> {
    const window = {
        employeeId: booking.assignedEmployeeId,
        projectId: booking.projectId,
        startsAt: booking.scheduledAt,
        endsAt: bookingEndsAt(booking.scheduledAt, booking.durationMinutes),
    };

    if (!(await isCoveredByShift(executor, window))) {
        throw new ApplicationError(
            'Время записи выходит за рамки рабочей смены сотрудника в этом проекте. Сначала добавьте смену на это время.',
        );
    }

    const overlapping = await findEmployeeBookings(executor, {
        employeeId: window.employeeId,
        startsAt: window.startsAt,
        endsAt: window.endsAt,
        excludeOrderId: booking.excludeOrderId,
    });

    if (overlapping.length > 0) {
        throw new ApplicationError(
            `Время пересекается с другими записями этого сотрудника (${overlapping.length} шт.)`,
        );
    }
}

export async function assertBookingFeasible(
    executor: Reader,
    booking: Booking,
): Promise<void> {
    await assertBookableEmployee(executor, booking);
    await assertAllowedPerformer(executor, booking);
    await assertFreeWindow(executor, booking);
}

export async function reassignBookings(
    window: EmployeeWindow,
    toEmployeeId: string,
    byUserId: string,
): Promise<{
    transferred: number;
    skipped: { orderId: string; reason: string }[];
}> {
    const bookings = await findEmployeeBookings(db, window);
    const skipped: { orderId: string; reason: string }[] = [];

    for (const booking of bookings) {
        try {
            await db.transaction(async (tx) => {
                const order = await lockOrder(
                    tx,
                    booking.id,
                    booking.projectId,
                );

                if (!order.scheduledAt || !order.durationMinutes) return;

                await lockEmployees(tx, [toEmployeeId]);

                await assertBookingFeasible(tx, {
                    projectId: order.projectId,
                    assignedEmployeeId: toEmployeeId,
                    scheduledAt: order.scheduledAt,
                    durationMinutes: order.durationMinutes,
                    items: await loadOrderItems(order.id, tx),
                    excludeOrderId: order.id,
                });

                await setOrderAssignedEmployee(
                    tx,
                    order,
                    toEmployeeId,
                    byUserId,
                );
            });
        } catch (error) {
            skipped.push({
                orderId: booking.id,
                reason: getErrorMessage(error),
            });
        }
    }

    return { transferred: bookings.length - skipped.length, skipped };
}
