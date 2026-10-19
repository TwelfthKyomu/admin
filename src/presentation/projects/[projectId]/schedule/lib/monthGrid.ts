import type { Currency } from '@/shared/constants/currency';
import { fmtMoney } from '@/shared/format/money';
import type { EmployeeShiftView } from '@/contexts/employeeShift';
import { salesTotal } from '@/contexts/order';
import {
    addDays,
    eachDayOfInterval,
    isSameDay,
    startOfMonth,
    startOfWeek,
    subDays,
} from 'date-fns';
import type { ScheduleSale } from './mapToScheduler';

export interface MonthDay {
    date: Date;
    isInCurrentMonth: boolean;
    isToday: boolean;
    sales: ScheduleSale[];
    shifts: EmployeeShiftView[];
}

export function computeMonthRange(date: Date): { from: Date; to: Date } {
    const from = startOfWeek(startOfMonth(date), { weekStartsOn: 1 });

    return { from, to: addDays(from, 42) };
}

export function buildMonthGrid(args: {
    date: Date;
    sales: ScheduleSale[];
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
            sales: args.sales.filter((sale) => isSameDay(sale.start, day)),
            shifts: args.shifts.filter((shift) =>
                isSameDay(shift.startsAt, day),
            ),
        }),
    );
}

export function monthSales(days: MonthDay[]): ScheduleSale[] {
    return days.flatMap((day) => (day.isInCurrentMonth ? day.sales : []));
}

export function salesAmount(sales: ScheduleSale[], currency: Currency): string {
    return fmtMoney(salesTotal(sales.map((sale) => sale.order)), currency);
}
