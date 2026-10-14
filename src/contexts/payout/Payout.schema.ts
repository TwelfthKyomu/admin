import { idSchema } from '@/shared/validation';
import * as z from 'zod/mini';

export const PayrollPreviewActionInputSchema = z.object({
    projectId: idSchema,
    from: z.coerce.date(),
    to: z.coerce.date(),
});

export const RecordPayoutActionInputSchema = z.object({
    projectId: idSchema,
    employeeId: idSchema,
    from: z.coerce.date(),
    to: z.coerce.date(),
});

export const DeletePayoutActionInputSchema = z.object({
    projectId: idSchema,
    payoutId: idSchema,
});
