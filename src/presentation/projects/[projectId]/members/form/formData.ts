import type { CreateProjectInviteActionInputSchema } from '@/contexts/projectInvite';
import type * as z from 'zod/mini';

export type CreateInviteFormValues = z.input<
    typeof CreateProjectInviteActionInputSchema
>;

export const INVITE_DEFAULT = {
    email: undefined,
};
