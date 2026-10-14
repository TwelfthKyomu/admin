import { DISPLAY_NAME_MAX, PERCENT_MAX } from '@/shared/constants/default';
import { idSchema, moneyAmountSchema } from '@/shared/validation/base';
import * as z from 'zod/mini';

export const ProjectEmployeesActionInputSchema = z.object({
    projectId: idSchema,
    includeEnded: z.optional(z.boolean()),
});

export const UpdateAssignmentActionInputSchema = z.object({
    id: idSchema,
    projectId: idSchema,
    position: z.optional(
        z
            .string()
            .check(z.trim(), z.minLength(1), z.maxLength(DISPLAY_NAME_MAX)),
    ),
    isBookable: z.optional(z.boolean()),
    metadata: z.optional(z.record(z.string(), z.unknown())),
});

export const UpdateAssignmentRatesActionInputSchema = z.object({
    id: idSchema,
    projectId: idSchema,
    shiftRateAmount: z.nullish(moneyAmountSchema),
    commissionRate: z.nullish(z.int().check(z.gte(0), z.lte(PERCENT_MAX))),
    deliveryRateAmount: z.nullish(moneyAmountSchema),
});
