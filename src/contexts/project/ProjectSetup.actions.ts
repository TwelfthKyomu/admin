'use server';

import { organizationMemberAction } from '@/shared/api/action-client';
import { isOrganizationManager } from '@/contexts/organizationMember/OrganizationMember.types';
import { listOrganizationProjects } from './Project.lib';
import { loadProjectSetup } from './ProjectSetup.lib';
import { isSetupComplete } from './ProjectSetup.types';

export const projectSetupAction = organizationMemberAction().action(
    async ({ ctx: { organizationId, role } }) => {
        if (!isOrganizationManager(role)) return [];

        const projects = await listOrganizationProjects(organizationId);

        if (projects.length === 0) return [];

        const setups = await loadProjectSetup(
            projects.map((project) => project.id),
        );

        return setups.filter((setup) => !isSetupComplete(setup));
    },
);
