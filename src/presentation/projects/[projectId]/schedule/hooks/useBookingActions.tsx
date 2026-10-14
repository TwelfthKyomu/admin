'use client';

import { runAction } from '@/shared/lib/action-result';
import { modal } from '@/shared/lib/modal';
import { useChangeOrderSchedule } from '@/contexts/order';
import type { SchedulePatch } from '@/ui/Base/Scheduler';
import { differenceInMinutes } from 'date-fns';
import dynamic from 'next/dynamic';
import { useScheduleContext } from '../components/ScheduleProvider';
import type { ScheduleBooking } from '../lib/mapToScheduler';

const BookingCreateModal = dynamic(() =>
    import('../modal/BookingCreateModal').then((m) => m.BookingCreateModal),
);

export function useBookingActions(columnsAreEmployees: boolean) {
    const { projectId, employeeOptions } = useScheduleContext();
    const { mutateAsync } = useChangeOrderSchedule(projectId);

    const reschedule = async (booking: ScheduleBooking, patch: SchedulePatch) => {
        const changesEmployee = columnsAreEmployees && patch.columnId !== booking.employeeId;

        await runAction(
            mutateAsync({
                id: booking.id,
                projectId,
                scheduledAt: patch.start,
                durationMinutes: differenceInMinutes(patch.end, patch.start),
                assignedEmployeeId: changesEmployee ? patch.columnId : undefined,
            }),
        );
    };

    const create = (patch: SchedulePatch) =>
        modal.open(
            <BookingCreateModal
                projectId={projectId}
                employeeOptions={employeeOptions}
                prefill={{
                    employeeId: patch.columnId,
                    start: patch.start,
                    durationMinutes: differenceInMinutes(patch.end, patch.start),
                }}
            />,
        );

    return { reschedule, create };
}
