'use client';

import { isOrderTerminal } from '@/contexts/order';
import { Scheduler } from '@/ui/Base/Scheduler';
import { BookingCard } from '../components/BookingCard';
import { EmployeeFilter } from '../components/EmployeeFilter';
import { ScheduleFooter } from '../components/ScheduleFooter';
import { useBookingActions } from '../hooks/useBookingActions';
import { useScheduleColumns } from '../hooks/useScheduleColumns';
import { bookingMatches, toScheduleBookings } from '../lib/mapToScheduler';
import { useScheduleContext } from './ScheduleProvider';

export const SchedulerTab = () => {
    const { date, setDate, mode, setMode, data, workingEmployees, employeeFilter } =
        useScheduleContext();

    const allBookings = toScheduleBookings(data.orders);

    const bookings =
        employeeFilter.size === 0
            ? allBookings
            : allBookings.filter((booking) => employeeFilter.has(booking.employeeId));

    const { columns, columnsAreEmployees } = useScheduleColumns();
    const actions = useBookingActions(columnsAreEmployees);

    return (
        <>
            <Scheduler
                date={date}
                onDateChange={setDate}
                mode={mode}
                onModeChange={setMode}
                items={bookings}
                columns={columns}
                renderItem={(ctx) => (
                    <BookingCard
                        key={ctx.item.id}
                        {...ctx}
                    />
                )}
                onMove={actions.reschedule}
                onResize={actions.reschedule}
                onCreate={columnsAreEmployees ? actions.create : undefined}
                isDragDisabled={(booking) => isOrderTerminal(booking.order.status)}
                excludeFromConflict={columnsAreEmployees ? undefined : () => true}
                searchPredicate={bookingMatches}
                topBarActionsSlot={<EmployeeFilter />}
            />
            <ScheduleFooter
                isLoading={data.isLoading}
                stats={[
                    { label: 'Записей', value: bookings.length },
                    { label: 'Сотрудников', value: workingEmployees.length },
                ]}
            />
        </>
    );
};
