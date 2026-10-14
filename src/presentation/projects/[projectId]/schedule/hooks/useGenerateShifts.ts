'use client';

import { useState } from 'react';
import { runAction } from '@/shared/lib/action-result';
import { toast } from '@/shared/lib/toast';
import {
    type ProjectEmployeeView,
    useUpdateAssignment,
} from '@/contexts/employeeAssignment';
import { useBulkCreateShifts } from '@/contexts/employeeShift';
import { addDays } from 'date-fns';
import {
    buildShiftsFromRows,
    createdShiftsMessage,
} from '../lib/generateShifts';
import {
    type DayRow,
    OFF_DAY,
    readDayRows,
    writeDayRows,
} from '../lib/weeklyTemplate';

const TEMPLATE_DEFAULT_DAYS = 13;

interface UseGenerateShiftsOptions {
    projectId: string;
    employees: ProjectEmployeeView[];
    onDone: () => void;
}

export function useGenerateShifts({
    projectId,
    employees,
    onDone,
}: UseGenerateShiftsOptions) {
    const bulk = useBulkCreateShifts(projectId);
    const updateAssignment = useUpdateAssignment(projectId);

    const [employeeId, setEmployeeId] = useState(
        employees[0]?.employeeId ?? '',
    );

    const [from, setFrom] = useState<Date | undefined>(() => new Date());

    const [to, setTo] = useState<Date | undefined>(() =>
        addDays(new Date(), TEMPLATE_DEFAULT_DAYS),
    );

    const [rows, setRows] = useState(() => readDayRows(employees[0]?.metadata));

    const selected = employees.find(
        (employee) => employee.employeeId === employeeId,
    );

    const shifts =
        employeeId && from && to
            ? buildShiftsFromRows(employeeId, from, to, rows)
            : [];

    const selectEmployee = (id: string) => {
        setEmployeeId(id);

        setRows(
            readDayRows(
                employees.find((employee) => employee.employeeId === id)
                    ?.metadata,
            ),
        );
    };

    const setRow = (day: number, patch: Partial<DayRow>) =>
        setRows((prev) => ({
            ...prev,
            [day]: { ...(prev[day] ?? OFF_DAY), ...patch },
        }));

    const submit = async () => {
        if (shifts.length === 0) return;

        const { success, response } = await runAction(
            bulk.mutateAsync({ projectId, shifts }),
        );

        if (!success) return;

        toast.success(createdShiftsMessage(response?.data));
        onDone();
    };

    const saveTemplate = async () => {
        if (!selected) return;

        await runAction(
            updateAssignment.mutateAsync({
                id: selected.assignmentId,
                projectId,
                metadata: writeDayRows(selected.metadata, rows),
            }),
            { success: 'Шаблон часов сохранён' },
        );
    };

    return {
        employeeId,
        setEmployeeId: selectEmployee,
        from,
        setFrom,
        to,
        setTo,
        rows,
        setRow,
        shifts,
        canSaveTemplate: Boolean(selected),
        saveTemplate,
        isSavingTemplate: updateAssignment.isPending,
        isPending: bulk.isPending,
        submit,
    };
}
