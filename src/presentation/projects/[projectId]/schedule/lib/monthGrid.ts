import type { EmployeeShiftView } from '@/contexts/employeeShift';
import type { OrderView } from '@/contexts/order';
import {
    addDays,
    eachDayOfInterval,
    isSameDay,
    startOfMonth,
    startOfWeek,
    subDays,
} from 'date-fns';

export interface MonthDay {
    date: Date;
    isInCurrentMonth: boolean;
    isToday: boolean;
    orders: OrderView[];
    shifts: EmployeeShiftView[];
}

export function computeMonthRange(date: Date): { from: Date; to: Date } {
    const from = startOfWeek(startOfMonth(date), { weekStartsOn: 1 });

    return { from, to: addDays(from, 42) };
}

export function buildMonthGrid(args: {
    date: Date;
    orders: OrderView[];
    shifts: EmployeeShiftView[];
}): MonthDay[] {
    const { from, to } = computeMonthRange(args.date);
    const currentMonth = args.date.getMonth();
    const today = new Date();

    return eachDayOfInterval({ start: from, end: subDays(to, 1) }).map(
        (day) => ({
            date: day,
            isInCurrentMonth: day.getMonth() === currentMonth,
            isToday: isSameDay(day, today),
            orders: args.orders.filter(
                (order) =>
                    order.scheduledAt && isSameDay(order.scheduledAt, day),
            ),
            shifts: args.shifts.filter((shift) =>
                isSameDay(shift.startsAt, day),
            ),
        }),
    );
}
