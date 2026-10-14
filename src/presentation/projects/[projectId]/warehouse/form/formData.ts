import type { AdjustStockActionInputSchema } from '@/contexts/stockMovement';
import type * as z from 'zod/mini';

export type AdjustStockFormValues = z.input<
    typeof AdjustStockActionInputSchema
>;
