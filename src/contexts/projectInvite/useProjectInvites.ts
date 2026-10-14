'use client';

import { makeScopedMutation } from '@/shared/lib/mutations';
import { listQuery } from '@/shared/lib/queries';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
    acceptProjectInviteAction,
    createProjectInviteAction,
    projectInvitesAction,
    revokeProjectInviteAction,
} from './ProjectInvite.actions';

const inviteQueries = {
    all: ['project-invites'] as const,
    list: (projectId: string) =>
        listQuery(
            [...inviteQueries.all, 'list', projectId],
            () => projectInvitesAction({ projectId }),
            { enabled: projectId.length > 0, staleTime: 15_000 },
        ),
};

export function useProjectInvitesList(projectId: string) {
    return useQuery(inviteQueries.list(projectId));
}

export const useCreateProjectInvite = makeScopedMutation(
    createProjectInviteAction,
);
export const useRevokeProjectInvite = makeScopedMutation(
    revokeProjectInviteAction,
);

export function useAcceptProjectInvite() {
    return useMutation({ mutationFn: acceptProjectInviteAction });
}
