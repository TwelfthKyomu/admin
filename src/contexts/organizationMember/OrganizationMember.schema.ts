import { idSchema } from '@/shared/validation/base';
import * as z from 'zod/mini';
import { ORGANIZATION_ROLE_VALUES } from './OrganizationMember.types';

export const OrganizationMembersActionInputSchema = z.object({
    organizationId: idSchema,
});

export const OffboardOrganizationMemberActionInputSchema = z.object({
    organizationId: idSchema,
    memberId: idSchema,
});

export const ChangeOrganizationMemberRoleActionInputSchema = z.object({
    organizationId: idSchema,
    memberId: idSchema,
    role: z.enum(ORGANIZATION_ROLE_VALUES),
});
