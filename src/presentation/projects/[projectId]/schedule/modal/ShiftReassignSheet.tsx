'use client';

import { FormDialog } from '@/shared/components/common';
import type { ProjectEmployeeView } from '@/contexts/employeeAssignment';
import { Input, Select } from '@/ui/Controlled';
import { useShiftReassignSheet } from '../hooks/useShiftReassignSheet';
import { employeeOptions } from '../lib/employees';

interface ShiftReassignSheetProps {
    projectId: string;
    shiftId: string;
    employeeName: string;
    candidates: ProjectEmployeeView[];
}

export const ShiftReassignSheet = ({
    projectId,
    shiftId,
    employeeName,
    candidates,
}: ShiftReassignSheetProps) => {
    const { isPending, form, onSubmit } = useShiftReassignSheet(projectId, shiftId);

    return (
        <FormDialog
            surface="sheet"
            title="Назначить замену"
            description={`Смену сотрудника «${employeeName}», его записи и доставки в окне смены передадим выбранному коллеге.`}
            form={form}
            onSubmit={onSubmit}
            submitLabel="Назначить"
            requireDirty={false}
            busy={isPending}
        >
            <Select
                name="substituteEmployeeId"
                label="Замещающий сотрудник"
                placeholder={
                    candidates.length > 0 ? 'Выберите сотрудника' : 'Нет свободных сотрудников'
                }
                options={employeeOptions(candidates)}
            />
            <Input
                name="reason"
                label="Причина (необязательно)"
                placeholder="Напр. заболел"
            />
        </FormDialog>
    );
};
