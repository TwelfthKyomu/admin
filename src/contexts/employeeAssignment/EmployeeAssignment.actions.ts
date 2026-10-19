'use server';

import {
    projectMutationAction,
    projectReadAction,
} from '@/shared/api/action-client';
import { ApplicationError } from '@/shared/api/errors';
import { hasProjectPermission } from '@/shared/api/permission';
import { findInProject, updateOne } from '@/shared/api/repository';
import {
    Permission,
    PROJECT_EMPLOYEES_READ_PERMISSIONS,
} from '@/contexts/user/User.types';
import { eq } from 'drizzle-orm';
import { listProjectEmployees } from './EmployeeAssignment.lib';
import {
    ProjectEmployeesActionInputSchema,
    UpdateAssignmentActionInputSchema,
    UpdateAssignmentRatesActionInputSchema,
} from './EmployeeAssignment.schema';
import { EmployeeKind } from './EmployeeAssignment.types';
import {
    type EmployeeAssignmentRecord,
    employeeAssignments,
} from './EmployeeAssignments.table';

async function findEditableAssignment(
    id: string,
    projectId: string,
): Promise<EmployeeAssignmentRecord> {
    const assignment = await findInProject(
        employeeAssignments,
        id,
        projectId,
        'Назначение не найдено',
    );

    if (assignment.endedAt !== null) {
        throw new ApplicationError('Нельзя изменить завершённое назначение');
    }

    return assignment;
}

export const projectEmployeesAction = projectReadAction(
    PROJECT_EMPLOYEES_READ_PERMISSIONS,
)
    .inputSchema(ProjectEmployeesActionInputSchema)
    .action(
        async ({ parsedInput: { projectId, includeEnded }, ctx: { userId } }) =>
            listProjectEmployees(projectId, {
                includeEnded: includeEnded ?? false,
                withRates: await hasProjectPermission(
                    userId,
                    projectId,
                    Permission.VIEW_FINANCES,
                ),
            }),
    );

export const updateAssignmentAction = projectMutationAction(
    Permission.MANAGE_ORDERS,
)
    .inputSchema(UpdateAssignmentActionInputSchema)
    .action(async ({ parsedInput }) => {
        const assignment = await findEditableAssignment(
            parsedInput.id,
            parsedInput.projectId,
        );

        return updateOne(
            employeeAssignments,
            eq(employeeAssignments.id, assignment.id),
            {
                position: parsedInput.position?.trim(),
                isBookable:
                    assignment.kind === EmployeeKind.COURIER
                        ? false
                        : parsedInput.isBookable,
                metadata: parsedInput.metadata,
            },
            'Назначение не найдено',
        );
    });

export const updateAssignmentRatesAction = projectMutationAction(
    Permission.MANAGE_FINANCES,
)
    .inputSchema(UpdateAssignmentRatesActionInputSchema)
    .action(async ({ parsedInput }) => {
        const assignment = await findEditableAssignment(
            parsedInput.id,
            parsedInput.projectId,
        );

        return updateOne(
            employeeAssignments,
            eq(employeeAssignments.id, assignment.id),
            {
                shiftRateAmount: parsedInput.shiftRateAmount,
                commissionRate: parsedInput.commissionRate,
                siteCommissionRate: parsedInput.siteCommissionRate,
                deliveryRateAmount: parsedInput.deliveryRateAmount,
            },
            'Назначение не найдено',
        );
    });
