import { idSchema, projectScopeSchema } from '@/shared/validation/base';
import { PROJECT_ROLE_VALUES } from '@/contexts/project/Project.types';
import * as z from 'zod/mini';

export const ProjectMembersActionInputSchema = projectScopeSchema;

export const DetachProjectMemberActionInputSchema = z.object({
    projectId: idSchema,
    memberId: idSchema,
});

export const ChangeProjectMemberRoleActionInputSchema = z.object({
    projectId: idSchema,
    memberId: idSchema,
    role: z.enum(PROJECT_ROLE_VALUES),
});

export const EnsureMemberScheduleActionInputSchema = z.object({
    projectId: idSchema,
    userId: idSchema,
});
