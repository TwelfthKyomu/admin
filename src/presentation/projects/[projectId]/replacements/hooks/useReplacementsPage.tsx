'use client';

import { useState } from 'react';
import { useProject } from '@/app/providers';
import { modal } from '@/shared/lib/modal';
import { useProjectEmployees } from '@/contexts/employeeAssignment';
import {
    type EmployeeShiftView,
    type ReplacementShiftView,
    ShiftStatus,
    useReplacementShifts,
    useSetShiftSeekingReplacement,
    useShiftsList,
} from '@/contexts/employeeShift';
import { Permission } from '@/contexts/user';
import dynamic from 'next/dynamic';
import { useKindParam } from '../../hooks/useKindParam';
import { overlaps } from '../lib/shifts';

const ShiftReassignSheet = dynamic(() =>
    import('../../schedule/modal/ShiftReassignSheet').then((m) => m.ShiftReassignSheet),
);

const BUSY_STATUSES: ShiftStatus[] = [ShiftStatus.SCHEDULED, ShiftStatus.IN_PROGRESS];

export interface OwnShiftRow extends EmployeeShiftView {
    employeeName: string;
}

export function useReplacementsPage() {
    const { projectId, currency, can } = useProject();
    const canAssign = can(Permission.MANAGE_ORDERS);
    const { kind, setKind, matches } = useKindParam();

    const query = useReplacementShifts(projectId);
    const employeesQuery = useProjectEmployees({ projectId });
    const [openedAt] = useState(() => new Date());
    const shiftsQuery = useShiftsList({ projectId, from: openedAt });
    const seekingMutation = useSetShiftSeekingReplacement(projectId);

    const employees = employeesQuery.data ?? [];
    const shifts = shiftsQuery.data ?? [];
    const nameById = new Map(employees.map((employee) => [employee.employeeId, employee.name]));

    const candidatesFor = (shift: ReplacementShiftView) =>
        employees
            .filter(
                (employee) =>
                    employee.employeeId !== shift.employeeId && employee.kind === shift.kind,
            )
            .filter(
                (employee) =>
                    !shifts.some(
                        (other) =>
                            other.employeeId === employee.employeeId &&
                            BUSY_STATUSES.includes(other.status) &&
                            overlaps(other, shift),
                    ),
            );

    const seeking = (query.data ?? []).filter((shift) => matches(shift.kind));

    const ownShifts: OwnShiftRow[] = shifts
        .filter((shift) => shift.status === ShiftStatus.SCHEDULED)
        .map((shift) => ({
            ...shift,
            employeeName: nameById.get(shift.employeeId) ?? 'Сотрудник',
        }));

    const onAssign = (shift: ReplacementShiftView) =>
        modal.open(
            <ShiftReassignSheet
                projectId={projectId}
                shiftId={shift.id}
                employeeName={shift.employeeName}
                candidates={candidatesFor(shift)}
            />,
        );

    const onToggleSeeking = (shift: EmployeeShiftView) =>
        seekingMutation.mutateAsync({
            id: shift.id,
            projectId,
            seeking: !shift.seekingReplacement,
        });

    return {
        query,
        currency,
        seeking,
        ownShifts,
        isOwnShiftsLoading: shiftsQuery.isLoading,
        canAssign,
        kind,
        setKind,
        candidatesFor,
        onAssign,
        onToggleSeeking,
        isTogglingSeeking: seekingMutation.isPending,
    };
}
