'use client';

import { makeMutation } from '@/shared/lib/mutations';
import { listQuery } from '@/shared/lib/queries';
import { useQuery } from '@tanstack/react-query';
import {
    changeProjectMemberRoleAction,
    detachProjectMemberAction,
    ensureMemberScheduleAction,
    projectMembersAction,
} from './ProjectMember.actions';

const projectMemberQueries = {
    all: ['project-members'] as const,
    list: (projectId: string) =>
        listQuery(
            [...projectMemberQueries.all, 'list', projectId],
            () => projectMembersAction({ projectId }),
            { enabled: projectId.length > 0 },
        ),
};

export function useProjectMembersList(projectId: string) {
    return useQuery(projectMemberQueries.list(projectId));
}

export const useDetachProjectMember = makeMutation(detachProjectMemberAction);
export const useChangeProjectMemberRole = makeMutation(
    changeProjectMemberRoleAction,
);
export const useEnsureMemberSchedule = makeMutation(ensureMemberScheduleAction);
