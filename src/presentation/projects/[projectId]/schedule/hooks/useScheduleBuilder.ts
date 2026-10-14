'use client';

import { useState } from 'react';
import { runAction } from '@/shared/lib/action-result';
import { toast } from '@/shared/lib/toast';
import {
    SHIFT_DEFAULT_END_TIME,
    SHIFT_DEFAULT_START_TIME,
    useBulkCreateShifts,
} from '@/contexts/employeeShift';
import { format } from 'date-fns';
import {
    buildShiftsForDays,
    createdShiftsMessage,
} from '../lib/generateShifts';

interface UseScheduleBuilderOptions {
    projectId: string;
    defaultEmployeeId: string;
}

export function useScheduleBuilder({
    projectId,
    defaultEmployeeId,
}: UseScheduleBuilderOptions) {
    const bulk = useBulkCreateShifts(projectId);

    const [active, setActive] = useState(false);
    const [chosenEmployeeId, setChosenEmployeeId] = useState('');
    const [start, setStart] = useState(SHIFT_DEFAULT_START_TIME);
    const [end, setEnd] = useState(SHIFT_DEFAULT_END_TIME);

    const [selectedDays, setSelectedDays] = useState<ReadonlyMap<string, Date>>(
        () => new Map(),
    );

    const employeeId = chosenEmployeeId || defaultEmployeeId;

    const setActiveAndPin = (next: boolean) => {
        if (next && !chosenEmployeeId && defaultEmployeeId) {
            setChosenEmployeeId(defaultEmployeeId);
        }

        setActive(next);
    };

    const toggleDay = (date: Date) => {
        const key = format(date, 'yyyy-MM-dd');

        setSelectedDays((prev) => {
            const next = new Map(prev);

            if (next.has(key)) next.delete(key);
            else next.set(key, date);

            return next;
        });
    };

    const clear = () => setSelectedDays(new Map());

    const close = () => {
        clear();
        setActive(false);
    };

    const submit = async () => {
        const shifts = buildShiftsForDays(
            employeeId,
            Array.from(selectedDays.values()),
            start,
            end,
        );

        if (!employeeId || shifts.length === 0) return;

        const { success, response } = await runAction(
            bulk.mutateAsync({ projectId, shifts }),
        );

        if (!success) return;

        toast.success(createdShiftsMessage(response?.data));
        clear();
    };

    return {
        active,
        setActive: setActiveAndPin,
        employeeId,
        setEmployeeId: setChosenEmployeeId,
        start,
        setStart,
        end,
        setEnd,
        selectedKeys: new Set(selectedDays.keys()),
        selectedCount: selectedDays.size,
        toggleDay,
        clear,
        close,
        isPending: bulk.isPending,
        submit,
    };
}
