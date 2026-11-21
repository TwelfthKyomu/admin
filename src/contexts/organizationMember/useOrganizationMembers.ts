'use client';

import { defineResource } from '@/shared/lib/resource';
import {
    changeOrganizationMemberRoleAction,
    offboardOrganizationMemberAction,
    organizationMembersAction,
} from './OrganizationMember.actions';

const organizationMembers = defineResource({
    key: ['organization-members'],
    list: {
        action: organizationMembersAction,
        input: (organizationId: string) => ({ organizationId }),
        enabled: (organizationId) => organizationId.length > 0,
    },
    mutations: {
        useChangeOrganizationMemberRole: changeOrganizationMemberRoleAction,
        useOffboardOrganizationMember: offboardOrganizationMemberAction,
    },
});

export const {
    useList: useOrganizationMembersList,
    mutations: {
        useChangeOrganizationMemberRole,
        useOffboardOrganizationMember,
    },
} = organizationMembers;
