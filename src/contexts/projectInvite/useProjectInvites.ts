'use client';

import { defineResource } from '@/shared/lib/resource';
import { useMutation } from '@tanstack/react-query';
import {
    acceptProjectInviteAction,
    createProjectInviteAction,
    projectInvitesAction,
    revokeProjectInviteAction,
} from './ProjectInvite.actions';

const invites = defineResource({
    key: ['project-invites'],
    list: {
        action: projectInvitesAction,
        input: (projectId: string) => ({ projectId }),
        enabled: (projectId) => projectId.length > 0,
        staleTime: 15_000,
    },
    mutations: {
        useCreateProjectInvite: createProjectInviteAction,
        useRevokeProjectInvite: revokeProjectInviteAction,
    },
});

export const { useList: useProjectInvitesList } = invites;

export const useAcceptProjectInvite = () => {
    return useMutation({ mutationFn: acceptProjectInviteAction });
};

export const {
    mutations: { useCreateProjectInvite, useRevokeProjectInvite },
} = invites;
