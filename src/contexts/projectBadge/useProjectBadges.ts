'use client';

import { makeScopedMutation } from '@/shared/lib/mutations';
import { listQuery } from '@/shared/lib/queries';
import { useQuery } from '@tanstack/react-query';
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

const projectBadgeQueries = {
    all: ['project-badges'] as const,
    list: ({
        projectId,
        includeInactive = false,
        enabled = true,
    }: ListOptions) =>
        listQuery(
            [...projectBadgeQueries.all, 'list', projectId, includeInactive],
            () => projectBadgesAction({ projectId, includeInactive }),
            { enabled: enabled && projectId.length > 0 },
        ),
};

export function useProjectBadgesList(opts: ListOptions) {
    return useQuery(projectBadgeQueries.list(opts));
}

export const useCreateProjectBadge = makeScopedMutation(
    createProjectBadgeAction,
);
export const useUpdateProjectBadge = makeScopedMutation(
    updateProjectBadgeAction,
);
export const useDeleteProjectBadge = makeScopedMutation(
    deleteProjectBadgeAction,
);
