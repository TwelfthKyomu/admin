import { idSchema } from '@/shared/validation/base';
import * as z from 'zod/mini';

export const AuditLogActionInputSchema = z.object({
    organizationId: idSchema,
});
