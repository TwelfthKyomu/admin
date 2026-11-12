'use client';

import { useScheduleContext } from '../components/ScheduleProvider';
import { buildMonthGrid, monthSales } from '../lib/monthGrid';

export const useCalendarTab = () => {
    const {
        date,
        setDate,
        setMode,
        setTab,
        data,
        builder,
        workingEmployees,
        currency,
    } = useScheduleContext();

    const days = buildMonthGrid({
        date,
        sales: data.sales,
        shifts: data.shifts,
    });

    const sales = monthSales(days);

    const shiftsInMonth = days.reduce(
        (acc, d) => acc + (d.isInCurrentMonth ? d.shifts.length : 0),
        0,
    );

    const handlePickDay = (d: Date) => {
        setDate(d);
        setMode('day');
        setTab('scheduler');
    };

    return {
        date,
        setDate,
        data,
        builder,
        workingEmployees,
        currency,
        days,
        sales,
        shiftsInMonth,
        handlePickDay,
    };
};
