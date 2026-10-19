'use client';

import { useProject } from '@/app/providers';
import { runAction } from '@/shared/lib/action-result';
import { confirmDestructive, modal } from '@/shared/lib/modal';
import type { ProjectEmployeeView } from '@/contexts/employeeAssignment';
import {
    type EmployeeShiftView,
    ShiftAction,
    ShiftStatus,
    useChangeShiftStatus,
} from '@/contexts/employeeShift';
import { ORDER_PERMISSIONS, Permission } from '@/contexts/user';
import dynamic from 'next/dynamic';

const ShiftCancelModal = dynamic(() =>
    import('../modal/ShiftCancelModal').then((m) => m.ShiftCancelModal),
);

const ShiftReassignSheet = dynamic(() =>
    import('../modal/ShiftReassignSheet').then((m) => m.ShiftReassignSheet),
);

interface UseShiftActionsOptions {
    projectId: string;
    shift: EmployeeShiftView;
    employeeName: string;
    workingEmployees: ProjectEmployeeView[];
}

export function useShiftActions({
    projectId,
    shift,
    employeeName,
    workingEmployees,
}: UseShiftActionsOptions) {
    const { can } = useProject();
    const { mutateAsync, isPending } = useChangeShiftStatus(projectId);

    const isScheduled = shift.status === ShiftStatus.SCHEDULED;
    const isActive = isScheduled || shift.status === ShiftStatus.IN_PROGRESS;

    const change = (action: ShiftAction, success: string) =>
        runAction(mutateAsync({ id: shift.id, projectId, action }), { success });

    const onReassign = () =>
        modal.open(
            <ShiftReassignSheet
                projectId={projectId}
                shiftId={shift.id}
                employeeName={employeeName}
                candidates={workingEmployees.filter(
                    (employee) => employee.employeeId !== shift.employeeId,
                )}
            />,
        );

    const onNoShow = () =>
        confirmDestructive({
            title: 'Отметить неявку?',
            description: (
                <>
                    Смена <strong>{employeeName}</strong> не будет оплачена. Записи в её окне нужно
                    перенести или передать.
                </>
            ),
            confirmLabel: 'Не вышел',
            success: 'Неявка отмечена',
            onConfirm: () => mutateAsync({ id: shift.id, projectId, action: ShiftAction.NO_SHOW }),
        });

    const onCancel = () =>
        modal.open(
            <ShiftCancelModal
                projectId={projectId}
                shiftId={shift.id}
                employeeName={employeeName}
            />,
        );

    return {
        isVisible: can(ORDER_PERMISSIONS) && isActive,
        canManage: can(Permission.MANAGE_ORDERS),
        isScheduled,
        isPending,
        onStart: () => change(ShiftAction.START, 'Смена начата'),
        onComplete: () => change(ShiftAction.COMPLETE, 'Смена завершена'),
        onReassign,
        onNoShow,
        onCancel,
    };
}
