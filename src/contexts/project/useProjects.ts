'use client';

import { makeMutation } from '@/shared/lib/mutations';
import { listQuery } from '@/shared/lib/queries';
import { useQuery } from '@tanstack/react-query';
import {
    createProjectAction,
    deleteProjectAction,
    projectsAction,
    updateProjectAction,
} from './Project.actions';

const projectQueries = {
    all: ['projects'] as const,
    list: (organizationId: string) =>
        listQuery(
            [...projectQueries.all, 'list', organizationId],
            () => projectsAction({ organizationId }),
            { enabled: organizationId.length > 0 },
        ),
};

export function useProjectsList(organizationId: string) {
    return useQuery(projectQueries.list(organizationId));
}

export const useCreateProject = makeMutation(createProjectAction);
export const useUpdateProject = makeMutation(updateProjectAction);
export const useDeleteProject = makeMutation(deleteProjectAction);
