import { fmtMinutesOfDay } from '@/shared/format/date';
import { minutesIntoDay } from '@/shared/lib/dateMath';
import { matchesSearch } from '@/shared/lib/search';
import { type EmployeeShiftView, ShiftStatus } from '@/contexts/employeeShift';
import type { OrderView } from '@/contexts/order';
import type { ScheduleItem } from '@/ui/Base/Scheduler';
import { addMinutes, isSameDay } from 'date-fns';

const DEFAULT_BOOKING_MINUTES = 60;

export interface ScheduleBooking extends ScheduleItem {
    employeeId: string;
    order: OrderView;
}

export function toScheduleBookings(orders: OrderView[]): ScheduleBooking[] {
    const bookings: ScheduleBooking[] = [];

    for (const order of orders) {
        if (!order.scheduledAt || !order.assignedEmployeeId) continue;

        bookings.push({
            id: order.id,
            start: order.scheduledAt,
            end: addMinutes(
                order.scheduledAt,
                order.durationMinutes ?? DEFAULT_BOOKING_MINUTES,
            ),
            employeeId: order.assignedEmployeeId,
            order,
        });
    }

    return bookings;
}

export function bookingMatches(
    booking: ScheduleBooking,
    query: string,
): boolean {
    const { customerName, customerPhone, notes } = booking.order;

    return matchesSearch(query, customerName, customerPhone, notes);
}

export function pickShiftWindow(
    shifts: EmployeeShiftView[],
    employeeId: string,
    date: Date,
): [number, number] | undefined {
    const shift = pickShift(shifts, employeeId, date);

    if (!shift) return undefined;

    return [minutesIntoDay(shift.startsAt), minutesIntoDay(shift.endsAt)];
}

export function pickTeamWindow(
    shifts: EmployeeShiftView[],
    employeeIds: string[],
    date: Date,
): [number, number] | undefined {
    const windows: [number, number][] = [];

    for (const employeeId of employeeIds) {
        const shiftWindow = pickShiftWindow(shifts, employeeId, date);

        if (shiftWindow) windows.push(shiftWindow);
    }

    if (windows.length === 0) return undefined;

    return [
        Math.min(...windows.map(([start]) => start)),
        Math.max(...windows.map(([, end]) => end)),
    ];
}

export function shiftWindowLabel([start, end]: [number, number]): string {
    return `${fmtMinutesOfDay(start)}–${fmtMinutesOfDay(end)}`;
}

export function pickShift(
    shifts: EmployeeShiftView[],
    employeeId: string,
    date: Date,
): EmployeeShiftView | undefined {
    for (const shift of shifts) {
        if (shift.employeeId !== employeeId) continue;

        if (
            shift.status === ShiftStatus.CANCELLED ||
            shift.status === ShiftStatus.NO_SHOW
        ) {
            continue;
        }

        if (!isSameDay(shift.startsAt, date)) continue;

        return shift;
    }

    return undefined;
}

export function pickCancelledShift(
    shifts: EmployeeShiftView[],
    employeeId: string,
    date: Date,
): EmployeeShiftView | undefined {
    return shifts.find(
        (shift) =>
            shift.employeeId === employeeId &&
            shift.status === ShiftStatus.CANCELLED &&
            isSameDay(shift.startsAt, date),
    );
}
