'use client';

import { makeScopedMutation } from '@/shared/lib/mutations';
import { nullToOptional } from '@/shared/lib/optional';
import { listQuery } from '@/shared/lib/queries';
import { broadcastScope } from '@/shared/realtime/scope';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
    createTaskAction,
    deleteTaskAction,
    tasksAction,
    updateTaskAction,
} from './Task.actions';

const taskQueries = {
    all: ['tasks'] as const,
    list: (projectId: string) =>
        listQuery(
            [...taskQueries.all, 'list', projectId],
            () => tasksAction({ projectId }),
            { enabled: projectId.length > 0, staleTime: 15_000 },
        ),
};

export function useTasksList(projectId: string) {
    return useQuery(taskQueries.list(projectId));
}

export const useCreateTask = makeScopedMutation(createTaskAction);
export const useUpdateTask = makeScopedMutation(updateTaskAction);
export const useDeleteTask = makeScopedMutation(deleteTaskAction);

export function useCreateTaskFromChat(projectId: string, chatScope: string) {
    return useMutation({
        mutationFn: async (input: Parameters<typeof createTaskAction>[0]) =>
            nullToOptional(await createTaskAction(input)),
        onSuccess: () => {
            broadcastScope(projectId);
            broadcastScope(chatScope);
        },
    });
}
