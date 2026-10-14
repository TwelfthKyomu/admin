import {
    DESCRIPTION_LONG_MAX,
    PAGE_SIZE_DEFAULT,
    PAGE_SIZE_SMALL,
} from '@/shared/constants/default';
import {
    entityInProjectSchema,
    idSchema,
    projectScopeSchema,
} from '@/shared/validation/base';
import * as z from 'zod/mini';
import { TASK_PRIORITY_VALUES, TASK_STATUS_VALUES } from './Task.types';

const subtaskSchema = z.object({
    id: z._default(z.string(), ''),
    title: z.string().check(z.trim(), z.minLength(1), z.maxLength(255)),
    done: z.boolean(),
});

const taskFieldsSchema = z.object({
    title: z.string().check(z.trim(), z.minLength(1), z.maxLength(255)),
    description: z.nullish(
        z.string().check(z.trim(), z.maxLength(DESCRIPTION_LONG_MAX)),
    ),
    status: z.enum(TASK_STATUS_VALUES),
    priority: z.enum(TASK_PRIORITY_VALUES),
    assigneeUserId: z.nullish(idSchema),
    dueAt: z.nullish(z.coerce.date()),
    labels: z._default(
        z
            .array(z.string().check(z.trim(), z.minLength(1), z.maxLength(32)))
            .check(z.maxLength(PAGE_SIZE_SMALL)),
        [],
    ),
    subtasks: z._default(
        z.array(subtaskSchema).check(z.maxLength(PAGE_SIZE_DEFAULT)),
        [],
    ),
});

export const TasksActionInputSchema = projectScopeSchema;

export const CreateTaskActionInputSchema = z.extend(taskFieldsSchema, {
    projectId: idSchema,
    chatMessageId: z.optional(idSchema),
});

export const UpdateTaskActionInputSchema = z.extend(
    z.partial(taskFieldsSchema),
    {
        id: idSchema,
        projectId: idSchema,
    },
);

export const DeleteTaskActionInputSchema = entityInProjectSchema;
