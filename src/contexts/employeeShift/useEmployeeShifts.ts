'use client';

import { defineResource } from '@/shared/lib/resource';
import {
    bulkCreateShiftsAction,
    changeShiftStatusAction,
    reassignShiftAction,
    replacementShiftsAction,
    setShiftSeekingReplacementAction,
    shiftsAction,
} from './EmployeeShift.actions';

interface ListOptions {
    projectId: string;
    from?: Date;
    to?: Date;
    employeeId?: string;
    enabled?: boolean;
}

const shifts = defineResource({
    key: ['shifts'],
    list: {
        action: shiftsAction,
        input: ({ projectId, from, to, employeeId }: ListOptions) => ({
            projectId,
            from,
            to,
            employeeId,
        }),
        enabled: ({ projectId, enabled = true }: ListOptions) =>
            enabled && projectId.length > 0,
    },
    mutations: {
        useSetShiftSeekingReplacement: setShiftSeekingReplacementAction,
        useBulkCreateShifts: bulkCreateShiftsAction,
        useChangeShiftStatus: changeShiftStatusAction,
        useReassignShift: reassignShiftAction,
    },
});

const replacementShifts = defineResource({
    key: ['replacement-shifts'],
    list: {
        action: replacementShiftsAction,
        input: (projectId: string) => ({ projectId }),
        enabled: (projectId) => projectId.length > 0,
        staleTime: 15_000,
    },
});

export const { useList: useShiftsList } = shifts;
export const { useList: useReplacementShifts } = replacementShifts;

export const {
    mutations: {
        useSetShiftSeekingReplacement,
        useBulkCreateShifts,
        useChangeShiftStatus,
        useReassignShift,
    },
} = shifts;
