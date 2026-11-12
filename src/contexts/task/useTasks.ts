'use client';

import { makeMutation } from '@/shared/lib/mutations';
import { listQuery } from '@/shared/lib/queries';
import { useQuery } from '@tanstack/react-query';
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

export const useTasksList = (projectId: string) => {
    return useQuery(taskQueries.list(projectId));
};

export const useCreateTask = makeMutation(createTaskAction);
export const useUpdateTask = makeMutation(updateTaskAction);
export const useDeleteTask = makeMutation(deleteTaskAction);
