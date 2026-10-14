'use client';

import { useState } from 'react';
import { useProject } from '@/app/providers';
import { computeRange, type SchedulerMode } from '@/ui/Base/Scheduler';
import { employeeOptions } from '../lib/employees';
import { computeMonthRange } from '../lib/monthGrid';
import { useScheduleBuilder } from './useScheduleBuilder';
import { useScheduleData } from './useScheduleData';

export type ScheduleTab = 'scheduler' | 'calendar';

export function useScheduleState() {
    const { projectId } = useProject();
    const [tab, setTab] = useState<ScheduleTab>('scheduler');
    const [date, setDate] = useState(() => new Date());
    const [mode, setMode] = useState<SchedulerMode>('week');

    const [employeeFilter, setEmployeeFilter] = useState<Set<string>>(
        () => new Set(),
    );

    const range =
        tab === 'calendar' ? computeMonthRange(date) : computeRange(date, mode);

    const data = useScheduleData({ projectId, ...range });

    const workingEmployees = data.employees.filter(
        (employee) => employee.isBookable,
    );

    const visibleEmployees =
        employeeFilter.size === 0
            ? workingEmployees
            : workingEmployees.filter((employee) =>
                  employeeFilter.has(employee.employeeId),
              );

    const builder = useScheduleBuilder({
        projectId,
        defaultEmployeeId: workingEmployees[0]?.employeeId ?? '',
    });

    const toggleEmployeeFilter = (id: string) =>
        setEmployeeFilter((prev) => {
            const next = new Set(prev);

            if (next.has(id)) next.delete(id);
            else next.add(id);

            return next;
        });

    return {
        projectId,
        tab,
        setTab,
        date,
        setDate,
        mode,
        setMode,
        data,
        workingEmployees,
        visibleEmployees,
        employeeOptions: employeeOptions(workingEmployees),
        employeeFilter,
        toggleEmployeeFilter,
        clearEmployeeFilter: () => setEmployeeFilter(new Set()),
        builder,
    };
}

export type ScheduleState = ReturnType<typeof useScheduleState>;
