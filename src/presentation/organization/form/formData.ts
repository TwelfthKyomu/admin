import type { CreateOrganizationActionInputSchema } from '@/contexts/organization';
import type * as z from 'zod/mini';

export type CreateOrganizationFormValues = z.input<
    typeof CreateOrganizationActionInputSchema
>;
