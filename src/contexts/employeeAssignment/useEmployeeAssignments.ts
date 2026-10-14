'use client';

import { makeScopedMutation } from '@/shared/lib/mutations';
import { listQuery } from '@/shared/lib/queries';
import { useQuery } from '@tanstack/react-query';
import {
    projectEmployeesAction,
    updateAssignmentAction,
    updateAssignmentRatesAction,
} from './EmployeeAssignment.actions';

interface ListOptions {
    projectId: string;
    includeEnded?: boolean;
    enabled?: boolean;
}

const assignmentQueries = {
    all: ['assignments'] as const,
    list: ({ projectId, includeEnded = false, enabled = true }: ListOptions) =>
        listQuery(
            [...assignmentQueries.all, 'list', projectId, includeEnded],
            () => projectEmployeesAction({ projectId, includeEnded }),
            { enabled: enabled && projectId.length > 0 },
        ),
};

export function useProjectEmployees(opts: ListOptions) {
    return useQuery(assignmentQueries.list(opts));
}

export const useUpdateAssignment = makeScopedMutation(updateAssignmentAction);
export const useUpdateAssignmentRates = makeScopedMutation(
    updateAssignmentRatesAction,
);
