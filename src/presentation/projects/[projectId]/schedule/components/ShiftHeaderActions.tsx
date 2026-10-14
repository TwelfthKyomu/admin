'use client';

import type { ProjectEmployeeView } from '@/contexts/employeeAssignment';
import type { EmployeeShiftView } from '@/contexts/employeeShift';
import { Button, Dropdown } from '@/ui/Base';
import { MoreVertical } from 'lucide-react';
import { useShiftActions } from '../hooks/useShiftActions';

interface ShiftHeaderActionsProps {
    projectId: string;
    shift: EmployeeShiftView;
    employeeName: string;
    workingEmployees: ProjectEmployeeView[];
}

export const ShiftHeaderActions = (props: ShiftHeaderActionsProps) => {
    const {
        isVisible,
        canManage,
        isScheduled,
        isPending,
        onStart,
        onComplete,
        onReassign,
        onNoShow,
        onCancel,
    } = useShiftActions(props);

    if (!isVisible) return null;

    return (
        <Dropdown
            align="end"
            trigger={
                <Button
                    size="icon"
                    variant="ghost"
                    className="size-6 shrink-0"
                    aria-label="Действия со сменой"
                    disabled={isPending}
                >
                    <MoreVertical className="size-3.5" />
                </Button>
            }
        >
            {isScheduled ? (
                <Dropdown.Item onSelect={onStart}>Начать смену</Dropdown.Item>
            ) : (
                <Dropdown.Item onSelect={onComplete}>Завершить смену</Dropdown.Item>
            )}
            {canManage && <Dropdown.Item onSelect={onReassign}>Заменить сотрудника</Dropdown.Item>}
            <Dropdown.Separator />
            {canManage && isScheduled && (
                <Dropdown.Item
                    variant="destructive"
                    onSelect={onNoShow}
                >
                    Не вышел на смену
                </Dropdown.Item>
            )}
            <Dropdown.Item
                variant="destructive"
                onSelect={onCancel}
            >
                Отменить смену
            </Dropdown.Item>
        </Dropdown>
    );
};
