'use client';

import { makeMutation } from '@/shared/lib/mutations';
import { listQuery } from '@/shared/lib/queries';
import { useQuery } from '@tanstack/react-query';
import {
    changeOrganizationMemberRoleAction,
    offboardOrganizationMemberAction,
    organizationMembersAction,
} from './OrganizationMember.actions';

const organizationMemberQueries = {
    all: ['organization-members'] as const,
    list: (organizationId: string) =>
        listQuery(
            [...organizationMemberQueries.all, 'list', organizationId],
            () => organizationMembersAction({ organizationId }),
            { enabled: organizationId.length > 0 },
        ),
};

export function useOrganizationMembersList(organizationId: string) {
    return useQuery(organizationMemberQueries.list(organizationId));
}

export const useChangeOrganizationMemberRole = makeMutation(
    changeOrganizationMemberRoleAction,
);

export const useOffboardOrganizationMember = makeMutation(
    offboardOrganizationMemberAction,
);
