'use client';

import { useProject } from '@/app/providers';
import { modal } from '@/shared/lib/modal';
import { Permission } from '@/contexts/user';
import dynamic from 'next/dynamic';
import { useScheduleContext } from '../components/ScheduleProvider';

const ShiftsGenerateModal = dynamic(() =>
    import('../modal/ShiftsGenerateModal').then((m) => m.ShiftsGenerateModal),
);

export const useScheduleButtons = () => {
    const { tab, projectId, workingEmployees, builder } = useScheduleContext();
    const { can } = useProject();

    const openGenerateShifts = () =>
        modal.open(
            <ShiftsGenerateModal
                projectId={projectId}
                employees={workingEmployees}
            />,
        );

    return {
        tab,
        builder,
        canManage: can(Permission.MANAGE_ORDERS),
        hasEmployees: workingEmployees.length > 0,
        openGenerateShifts,
    };
};
