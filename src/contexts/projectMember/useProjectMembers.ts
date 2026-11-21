'use client';

import { defineResource } from '@/shared/lib/resource';
import {
    changeProjectMemberRoleAction,
    detachProjectMemberAction,
    ensureMemberScheduleAction,
    projectMembersAction,
} from './ProjectMember.actions';

const projectMembers = defineResource({
    key: ['project-members'],
    list: {
        action: projectMembersAction,
        input: (projectId: string) => ({ projectId }),
        enabled: (projectId) => projectId.length > 0,
    },
    mutations: {
        useDetachProjectMember: detachProjectMemberAction,
        useChangeProjectMemberRole: changeProjectMemberRoleAction,
        useEnsureMemberSchedule: ensureMemberScheduleAction,
    },
});

export const {
    useList: useProjectMembersList,
    mutations: {
        useDetachProjectMember,
        useChangeProjectMemberRole,
        useEnsureMemberSchedule,
    },
} = projectMembers;
