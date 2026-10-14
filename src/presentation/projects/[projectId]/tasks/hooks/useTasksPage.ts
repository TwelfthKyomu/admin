'use client';

import { useProject } from '@/app/providers';
import { NONE } from '@/shared/lib/none';
import { useProjectMembersList } from '@/contexts/projectMember';
import { useTasksList } from '@/contexts/task';
import { filterTasks, type TaskFilterValues } from '../lib/tasks';

export function useTasksPage(filters: TaskFilterValues) {
    const { projectId, project } = useProject();
    const query = useTasksList(projectId);
    const membersQuery = useProjectMembersList(projectId);

    const members = membersQuery.data ?? [];

    return {
        query,
        tasks: filterTasks(query.data ?? [], filters),
        projectKey: project?.key ?? 'TASK',
        memberNames: new Map(
            members.map((member) => [member.userId, member.userName]),
        ),
        assigneeOptions: [
            { value: NONE, label: 'Не назначено' },
            ...members.map((member) => ({
                value: member.userId,
                label: member.userName,
            })),
        ],
    };
}
