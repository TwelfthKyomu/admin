import { LABEL_MAX, NAME_MIN } from '@/shared/constants/default';
import * as z from 'zod/mini';

export const CreateOrganizationActionInputSchema = z.object({
    name: z
        .string()
        .check(z.trim(), z.minLength(NAME_MIN), z.maxLength(LABEL_MAX)),
});
