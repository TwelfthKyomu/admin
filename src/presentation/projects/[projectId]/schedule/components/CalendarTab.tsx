'use client';

import { ScheduleFooter } from '../components/ScheduleFooter';
import { buildMonthGrid, monthSales, salesAmount } from '../lib/monthGrid';
import { MonthCalendar } from './MonthCalendar';
import { useScheduleContext } from './ScheduleProvider';

export const CalendarTab = () => {
    const { date, setDate, setMode, setTab, data, builder, workingEmployees, currency } =
        useScheduleContext();

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

    return (
        <>
            <MonthCalendar
                date={date}
                days={days}
                currency={currency}
                onDateChange={setDate}
                onPickDay={handlePickDay}
                selectable={builder.active}
                selectedKeys={builder.selectedKeys}
                onToggleDay={builder.toggleDay}
                className="flex-1"
            />
            <ScheduleFooter
                isLoading={data.isLoading}
                stats={[
                    { label: 'Продаж в месяце', value: sales.length },
                    { label: 'Выручка', value: salesAmount(sales, currency) },
                    { label: 'Смен', value: shiftsInMonth },
                    { label: 'Сотрудников', value: workingEmployees.length },
                ]}
            />
        </>
    );
};
