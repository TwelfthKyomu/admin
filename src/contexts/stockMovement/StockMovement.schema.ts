import { NOTE_MAX } from '@/shared/constants/default';
import { idSchema } from '@/shared/validation';
import { projectScopeSchema } from '@/shared/validation/base';
import * as z from 'zod/mini';

export const AdjustStockActionInputSchema = z.object({
    projectId: idSchema,
    productId: idSchema,
    variantId: z.nullish(idSchema),
    stock: z.nullable(z.int().check(z.gte(0))),
    note: z.optional(z.string().check(z.trim(), z.maxLength(NOTE_MAX))),
});

export const StockMovementsActionInputSchema = z.object({
    projectId: idSchema,
    productId: z.optional(idSchema),
});

export const StockOverviewActionInputSchema = projectScopeSchema;
