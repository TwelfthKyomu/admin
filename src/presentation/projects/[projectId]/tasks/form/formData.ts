import { NONE } from '@/shared/lib/none';
import {
    CreateTaskActionInputSchema,
    TaskPriority,
    TaskStatus,
} from '@/contexts/task';
import * as z from 'zod/mini';

export const TaskFormSchema = z.omit(CreateTaskActionInputSchema, {
    projectId: true,
});

export type TaskFormValues = z.input<typeof TaskFormSchema>;

export const TASK_DEFAULT: TaskFormValues = {
    title: '',
    description: '',
    status: TaskStatus.TODO,
    priority: TaskPriority.NONE,
    assigneeUserId: NONE,
    dueAt: null,
    subtasks: [],
};
