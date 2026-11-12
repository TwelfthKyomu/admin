import { NOTE_MAX } from '@/shared/constants/default';
import { idSchema } from '@/shared/validation';
import {
    moneyAmountSchema,
    nonNegativeIntSchema,
    positiveIntSchema,
    projectScopeSchema,
} from '@/shared/validation/base';
import * as z from 'zod/mini';

const stockOperationFields = {
    projectId: idSchema,
    productId: idSchema,
    variantId: z.nullish(idSchema),
    warehouseId: idSchema,
    note: z.optional(z.string().check(z.trim(), z.maxLength(NOTE_MAX))),
};

export const StockOperationActionInputSchema = z.object({
    ...stockOperationFields,
    quantity: positiveIntSchema,
});

export const ReceiveStockActionInputSchema = z.object({
    ...stockOperationFields,
    quantity: positiveIntSchema,
    costAmount: z.nullish(moneyAmountSchema),
});

export const CountStockActionInputSchema = z.object({
    ...stockOperationFields,
    quantity: nonNegativeIntSchema,
});

export const TransferStockActionInputSchema = z.object({
    ...stockOperationFields,
    quantity: positiveIntSchema,
    toWarehouseId: idSchema,
});

export const StockMovementsActionInputSchema = z.object({
    projectId: idSchema,
    productId: z.optional(idSchema),
});

export const StockOverviewActionInputSchema = projectScopeSchema;

export const OrderStockActionInputSchema = z.object({
    projectId: idSchema,
    orderId: idSchema,
});
