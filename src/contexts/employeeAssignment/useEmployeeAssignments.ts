'use client';

import { defineResource } from '@/shared/lib/resource';
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

const assignments = defineResource({
    key: ['assignments'],
    list: {
        action: projectEmployeesAction,
        input: ({ projectId, includeEnded }: ListOptions) => ({
            projectId,
            includeEnded,
        }),
        enabled: ({ projectId, enabled = true }: ListOptions) =>
            enabled && projectId.length > 0,
    },
    mutations: {
        useUpdateAssignment: updateAssignmentAction,
        useUpdateAssignmentRates: updateAssignmentRatesAction,
    },
});

export const {
    useList: useProjectEmployees,
    mutations: { useUpdateAssignment, useUpdateAssignmentRates },
} = assignments;
