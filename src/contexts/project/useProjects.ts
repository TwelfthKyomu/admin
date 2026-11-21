'use client';

import { listQuery } from '@/shared/lib/queries';
import { defineResource } from '@/shared/lib/resource';
import { useQuery } from '@tanstack/react-query';
import {
    createProjectAction,
    deleteProjectAction,
    projectsAction,
    updateProjectAction,
} from './Project.actions';
import { projectSetupAction } from './ProjectSetup.actions';

const projects = defineResource({
    key: ['projects'],
    list: {
        action: projectsAction,
        input: (organizationId: string) => ({ organizationId }),
        enabled: (organizationId) => organizationId.length > 0,
    },
    mutations: {
        useCreateProject: createProjectAction,
        useUpdateProject: updateProjectAction,
        useDeleteProject: deleteProjectAction,
    },
});

export const { useList: useProjectsList } = projects;

export const useProjectSetup = () => {
    return useQuery(listQuery(['project-setup'], projectSetupAction));
};

export const {
    mutations: { useCreateProject, useUpdateProject, useDeleteProject },
} = projects;
