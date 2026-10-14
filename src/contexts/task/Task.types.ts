import { enumValues } from '@/shared/lib/enum';
import type { TaskRecord } from './Tasks.table';

export const TaskStatus = {
    BACKLOG: 'backlog',
    TODO: 'todo',
    IN_PROGRESS: 'in_progress',
    REVIEW: 'review',
    DONE: 'done',
} as const;

export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export const TASK_STATUS_VALUES = enumValues(TaskStatus);

export const TaskPriority = {
    NONE: 'none',
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    URGENT: 'urgent',
} as const;

export type TaskPriority = (typeof TaskPriority)[keyof typeof TaskPriority];

export const TASK_PRIORITY_VALUES = enumValues(TaskPriority);

export interface TaskSubtask {
    id: string;
    title: string;
    done: boolean;
}

export type MyTaskView = Pick<
    TaskRecord,
    'id' | 'projectId' | 'number' | 'title' | 'status' | 'priority' | 'dueAt'
> & {
    projectKey: string;
};
