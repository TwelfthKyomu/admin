'use client';

import { useProject } from '@/app/providers';
import { modal } from '@/shared/lib/modal';
import { Permission } from '@/contexts/user';
import { Button } from '@/ui/Base';
import { CalendarPlus } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useScheduleContext } from './ScheduleProvider';

const ShiftsGenerateModal = dynamic(() =>
    import('../modal/ShiftsGenerateModal').then((m) => m.ShiftsGenerateModal),
);

export const Buttons = () => {
    const { tab, projectId, workingEmployees, builder } = useScheduleContext();
    const { can } = useProject();

    if (!can(Permission.MANAGE_BOOKINGS)) return null;

    const openGenerateShifts = () =>
        modal.open(
            <ShiftsGenerateModal
                projectId={projectId}
                employees={workingEmployees}
            />,
        );

    return tab === 'calendar' ? (
        <Button
            type="button"
            size="sm"
            variant="outline"
            className="ml-auto"
            disabled={builder.active || workingEmployees.length === 0}
            onClick={() => builder.setActive(true)}
        >
            <CalendarPlus />
            Конструктор графика
        </Button>
    ) : (
        <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={workingEmployees.length === 0}
            onClick={openGenerateShifts}
        >
            Сгенерировать смены
        </Button>
    );
};
