import {
    entityInProjectSchema,
    idSchema,
    projectScopeSchema,
} from '@/shared/validation/base';
import * as z from 'zod/mini';

export const ProjectInvitesActionInputSchema = projectScopeSchema;

export const CreateProjectInviteActionInputSchema = z.object({
    projectId: idSchema,
    email: z.optional(z.email()),
});

export const RevokeProjectInviteActionInputSchema = entityInProjectSchema;

export const AcceptProjectInviteActionInputSchema = z.object({
    token: z.string().check(z.minLength(1)),
    code: z.string().check(z.regex(/^\d{6}$/, 'Введите 6-значный код')),
});
