'use client';

import { defineResource } from '@/shared/lib/resource';
import {
    createProjectBadgeAction,
    deleteProjectBadgeAction,
    projectBadgesAction,
    updateProjectBadgeAction,
} from './ProjectBadge.actions';

interface ListOptions {
    projectId: string;
    includeInactive?: boolean;
    enabled?: boolean;
}

const projectBadges = defineResource({
    key: ['project-badges'],
    list: {
        action: projectBadgesAction,
        input: ({ projectId, includeInactive }: ListOptions) => ({
            projectId,
            includeInactive,
        }),
        enabled: ({ projectId, enabled = true }: ListOptions) =>
            enabled && projectId.length > 0,
    },
    mutations: {
        useCreateProjectBadge: createProjectBadgeAction,
        useUpdateProjectBadge: updateProjectBadgeAction,
        useDeleteProjectBadge: deleteProjectBadgeAction,
    },
});

export const {
    useList: useProjectBadgesList,
    mutations: {
        useCreateProjectBadge,
        useUpdateProjectBadge,
        useDeleteProjectBadge,
    },
} = projectBadges;
