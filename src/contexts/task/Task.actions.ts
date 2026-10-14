'use server';

import { db } from '@/infrastructure/database/client';
import {
    projectMutationAction,
    projectReadAction,
} from '@/shared/api/action-client';
import { ApplicationError } from '@/shared/api/errors';
import {
    deleteInProject,
    insertOne,
    updateInProject,
} from '@/shared/api/repository';
import { mapDefined } from '@/shared/lib/utils';
import { requireAccessibleMessage } from '@/contexts/chat/Chat.lib';
import { nextTaskNumber } from '@/contexts/project/Project.lib';
import { findActiveProjectMember } from '@/contexts/projectMember/ProjectMember.lib';
import { Permission, TASK_WRITE_PERMISSIONS } from '@/contexts/user/User.types';
import { desc, eq } from 'drizzle-orm';
import {
    CreateTaskActionInputSchema,
    DeleteTaskActionInputSchema,
    TasksActionInputSchema,
    UpdateTaskActionInputSchema,
} from './Task.schema';
import type { TaskSubtask } from './Task.types';
import { tasks } from './Tasks.table';

function withSubtaskIds(subtasks: TaskSubtask[]): TaskSubtask[] {
    return subtasks.map((subtask) =>
        subtask.id ? subtask : { ...subtask, id: crypto.randomUUID() },
    );
}

async function assertAssigneeInProject(
    projectId: string,
    assigneeUserId: string | null | undefined,
): Promise<void> {
    if (!assigneeUserId) return;
    if (!(await findActiveProjectMember(projectId, assigneeUserId))) {
        throw new ApplicationError('Исполнитель не участвует в проекте');
    }
}

export const tasksAction = projectReadAction(Permission.VIEW_MEMBERS)
    .inputSchema(TasksActionInputSchema)
    .action(({ parsedInput }) =>
        db
            .select()
            .from(tasks)
            .where(eq(tasks.projectId, parsedInput.projectId))
            .orderBy(desc(tasks.number)),
    );

export const createTaskAction = projectMutationAction(TASK_WRITE_PERMISSIONS)
    .inputSchema(CreateTaskActionInputSchema)
    .action(async ({ parsedInput, ctx: { userId, organizationId } }) => {
        await Promise.all([
            assertAssigneeInProject(
                parsedInput.projectId,
                parsedInput.assigneeUserId,
            ),
            parsedInput.chatMessageId
                ? requireAccessibleMessage(
                      userId,
                      organizationId,
                      parsedInput.chatMessageId,
                  )
                : null,
        ]);

        return db.transaction(async (tx) => {
            const number = await nextTaskNumber(tx, parsedInput.projectId);

            return insertOne(
                tasks,
                {
                    ...parsedInput,
                    number,
                    description: parsedInput.description || null,
                    subtasks: withSubtaskIds(parsedInput.subtasks),
                },
                'Не удалось создать задачу',
                tx,
            );
        });
    });

export const updateTaskAction = projectMutationAction(TASK_WRITE_PERMISSIONS)
    .inputSchema(UpdateTaskActionInputSchema)
    .action(async ({ parsedInput: { id, projectId, ...patch } }) => {
        await assertAssigneeInProject(projectId, patch.assigneeUserId);

        return updateInProject(
            tasks,
            id,
            projectId,
            {
                ...patch,
                description: mapDefined(
                    patch.description,
                    (value) => value || null,
                ),
                subtasks: mapDefined(patch.subtasks, withSubtaskIds),
            },
            'Задача не найдена',
        );
    });

export const deleteTaskAction = projectMutationAction(TASK_WRITE_PERMISSIONS)
    .inputSchema(DeleteTaskActionInputSchema)
    .action(({ parsedInput: { id, projectId } }) =>
        deleteInProject(tasks, id, projectId, 'Задача не найдена'),
    );
