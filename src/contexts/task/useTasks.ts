'use client';

import { defineResource } from '@/shared/lib/resource';
import {
    createTaskAction,
    deleteTaskAction,
    tasksAction,
    updateTaskAction,
} from './Task.actions';

const tasks = defineResource({
    key: ['tasks'],
    list: {
        action: tasksAction,
        input: (projectId: string) => ({ projectId }),
        enabled: (projectId) => projectId.length > 0,
        staleTime: 15_000,
    },
    mutations: {
        useCreateTask: createTaskAction,
        useUpdateTask: updateTaskAction,
        useDeleteTask: deleteTaskAction,
    },
});

export const {
    useList: useTasksList,
    mutations: { useCreateTask, useUpdateTask, useDeleteTask },
} = tasks;
