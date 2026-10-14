'use client';

import { ScheduleFooter } from '../components/ScheduleFooter';
import { buildMonthGrid } from '../lib/monthGrid';
import { MonthCalendar } from './MonthCalendar';
import { useScheduleContext } from './ScheduleProvider';

export const CalendarTab = () => {
    const { date, setDate, setMode, setTab, data, builder, workingEmployees } =
        useScheduleContext();

    const days = buildMonthGrid({
        date,
        orders: data.orders,
        shifts: data.shifts,
    });

    const ordersInMonth = days.reduce(
        (acc, d) => acc + (d.isInCurrentMonth ? d.orders.length : 0),
        0,
    );

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
                    { label: 'Заказов в месяце', value: ordersInMonth },
                    { label: 'Смен', value: shiftsInMonth },
                    { label: 'Сотрудников', value: workingEmployees.length },
                ]}
            />
        </>
    );
};
