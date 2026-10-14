'use client';

import { makeScopedMutation } from '@/shared/lib/mutations';
import { listQuery } from '@/shared/lib/queries';
import { useQuery } from '@tanstack/react-query';
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

const shiftQueries = {
    all: ['shifts'] as const,
    list: ({ projectId, from, to, employeeId, enabled = true }: ListOptions) =>
        listQuery(
            [
                ...shiftQueries.all,
                'list',
                projectId,
                from?.toISOString() ?? '',
                to?.toISOString() ?? '',
                employeeId ?? '',
            ],
            () => shiftsAction({ projectId, from, to, employeeId }),
            { enabled: enabled && projectId.length > 0 },
        ),
};

export function useShiftsList(opts: ListOptions) {
    return useQuery(shiftQueries.list(opts));
}

const replacementShiftQueries = {
    all: ['replacement-shifts'] as const,
    list: (projectId: string) =>
        listQuery(
            [...replacementShiftQueries.all, 'list', projectId],
            () => replacementShiftsAction({ projectId }),
            { enabled: projectId.length > 0, staleTime: 15_000 },
        ),
};

export function useReplacementShifts(projectId: string) {
    return useQuery(replacementShiftQueries.list(projectId));
}

export const useSetShiftSeekingReplacement = makeScopedMutation(
    setShiftSeekingReplacementAction,
);

export const useBulkCreateShifts = makeScopedMutation(bulkCreateShiftsAction);
export const useChangeShiftStatus = makeScopedMutation(changeShiftStatusAction);

export const useReassignShift = makeScopedMutation(reassignShiftAction);
