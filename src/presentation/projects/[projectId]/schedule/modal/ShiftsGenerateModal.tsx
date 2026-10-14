'use client';

import { useModalClose } from '@/shared/lib/modal';
import type { ProjectEmployeeView } from '@/contexts/employeeAssignment';
import { Button, DatePicker, Field, FieldGroup, FieldLabel, Modal, Select } from '@/ui/Base';
import { WeekdayHoursEditor } from '../components/WeekdayHoursEditor';
import { useGenerateShifts } from '../hooks/useGenerateShifts';
import { employeeOptions } from '../lib/employees';

interface GenerateShiftsModalProps {
    projectId: string;
    employees: ProjectEmployeeView[];
}

export const ShiftsGenerateModal = ({ projectId, employees }: GenerateShiftsModalProps) => {
    const close = useModalClose();

    const form = useGenerateShifts({
        projectId,
        employees,
        onDone: close,
    });

    return (
        <Modal
            onClose={close}
            busy={form.isPending}
            title="Сгенерировать смены"
            description="Недельный шаблон → смены на диапазон дат. Пересечения и дни без смен сервер пропустит."
        >
            <FieldGroup>
                <Field>
                    <FieldLabel>Сотрудник</FieldLabel>
                    <Select
                        value={form.employeeId}
                        onValueChange={form.setEmployeeId}
                        placeholder="Сотрудник"
                        options={employeeOptions(employees)}
                    />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                    <Field>
                        <FieldLabel>С</FieldLabel>
                        <DatePicker
                            value={form.from}
                            onValueChange={form.setFrom}
                        />
                    </Field>
                    <Field>
                        <FieldLabel>По</FieldLabel>
                        <DatePicker
                            value={form.to}
                            minDate={form.from}
                            onValueChange={form.setTo}
                        />
                    </Field>
                </div>

                <WeekdayHoursEditor
                    rows={form.rows}
                    onChange={form.setRow}
                />

                {form.canSaveTemplate && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={form.isSavingTemplate}
                        onClick={form.saveTemplate}
                    >
                        Сохранить как шаблон сотрудника
                    </Button>
                )}
            </FieldGroup>

            <Modal.Footer>
                <Button
                    type="button"
                    disabled={form.isPending || form.shifts.length === 0 || !form.employeeId}
                    onClick={form.submit}
                >
                    {`Создать ${form.shifts.length} смен`}
                </Button>
                <Modal.CloseButton asChild>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={form.isPending}
                        onClick={close}
                    >
                        Отмена
                    </Button>
                </Modal.CloseButton>
            </Modal.Footer>
        </Modal>
    );
};
