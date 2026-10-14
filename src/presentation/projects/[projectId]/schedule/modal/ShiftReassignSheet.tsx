'use client';

import { type SubmitHandler, useForm } from 'react-hook-form';
import { FormDialog } from '@/shared/components/common';
import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import type { ProjectEmployeeView } from '@/contexts/employeeAssignment';
import {
    ReassignShiftActionInputSchema,
    type ReassignShiftFormValues,
    useReassignShift,
} from '@/contexts/employeeShift';
import { Input, Select } from '@/ui/Controlled';
import { zodResolver } from '@hookform/resolvers/zod';
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
    const close = useModalClose();
    const { mutateAsync, isPending } = useReassignShift(projectId);

    const form = useForm<ReassignShiftFormValues>({
        values: { id: shiftId, projectId, substituteEmployeeId: '', reason: '' },
        resolver: zodResolver(ReassignShiftActionInputSchema),
        mode: 'onChange',
    });

    const onSubmit: SubmitHandler<ReassignShiftFormValues> = async (values) => {
        const { success } = await runAction(mutateAsync(values), {
            success: 'Замена назначена: записи и доставки из окна смены перешли замене',
        });

        if (success) close();
    };

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
