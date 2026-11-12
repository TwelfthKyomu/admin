'use client';

import { ScheduleFooter } from '../components/ScheduleFooter';
import { useCalendarTab } from '../hooks/useCalendarTab';
import { salesAmount } from '../lib/monthGrid';
import { MonthCalendar } from './MonthCalendar';

export const CalendarTab = () => {
    const {
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
    } = useCalendarTab();

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
