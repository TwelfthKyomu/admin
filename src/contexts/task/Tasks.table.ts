import { createdAt, id, textArray } from '@/infrastructure/database/columns';
import {
    taskPriorityEnum,
    taskStatusEnum,
} from '@/infrastructure/database/schemas/enums';
import { chatMessages } from '@/contexts/chat/ChatChannels.table';
import { projects } from '@/contexts/project/Projects.table';
import { users } from '@/contexts/user/Users.table';
import {
    index,
    integer,
    jsonb,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
    varchar,
} from 'drizzle-orm/pg-core';
import { TaskPriority, TaskStatus, type TaskSubtask } from './Task.types';

export const tasks = pgTable(
    'tasks',
    {
        id,
        projectId: text('project_id')
            .notNull()
            .references(() => projects.id, { onDelete: 'cascade' }),

        number: integer('number').notNull(),
        title: varchar('title', { length: 255 }).notNull(),
        description: text('description'),
        status: taskStatusEnum('status').notNull().default(TaskStatus.TODO),
        priority: taskPriorityEnum('priority')
            .notNull()
            .default(TaskPriority.NONE),
        assigneeUserId: text('assignee_user_id').references(() => users.id, {
            onDelete: 'set null',
        }),
        dueAt: timestamp('due_at'),
        labels: textArray('labels'),
        subtasks: jsonb('subtasks')
            .notNull()
            .default([])
            .$type<TaskSubtask[]>(),
        chatMessageId: text('chat_message_id').references(
            () => chatMessages.id,
            { onDelete: 'set null' },
        ),
        createdAt,
    },
    (t) => [
        uniqueIndex('tasks_project_number_unique').on(t.projectId, t.number),
        index('tasks_project_status_idx').on(t.projectId, t.status),
        index('tasks_assignee_idx').on(t.assigneeUserId),
        uniqueIndex('tasks_chat_message_unique').on(t.chatMessageId),
    ],
);

export type TaskRecord = typeof tasks.$inferSelect;

export type TaskView = TaskRecord;
