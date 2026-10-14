import 'server-only';

import { db } from '@/infrastructure/database/client';
import { PAGE_SIZE_SMALL } from '@/shared/constants/default';
import { projects } from '@/contexts/project/Projects.table';
import { and, asc, desc, eq, inArray, ne } from 'drizzle-orm';
import { type MyTaskView, TaskStatus } from './Task.types';
import { tasks } from './Tasks.table';

export async function listAssignedTasks(
    userId: string,
    projectIds: string[],
): Promise<MyTaskView[]> {
    if (projectIds.length === 0) return [];

    return db
        .select({
            id: tasks.id,
            projectId: tasks.projectId,
            number: tasks.number,
            title: tasks.title,
            status: tasks.status,
            priority: tasks.priority,
            dueAt: tasks.dueAt,
            projectKey: projects.key,
        })
        .from(tasks)
        .innerJoin(projects, eq(projects.id, tasks.projectId))
        .where(
            and(
                eq(tasks.assigneeUserId, userId),
                inArray(tasks.projectId, projectIds),
                ne(tasks.status, TaskStatus.DONE),
            ),
        )
        .orderBy(asc(tasks.dueAt), desc(tasks.number))
        .limit(PAGE_SIZE_SMALL);
}
