import {
    DESCRIPTION_LONG_MAX,
    LABEL_MAX,
    PHONE_MAX,
} from '@/shared/constants/default';
import { moneyAmountSchema } from '@/shared/validation/base';
import { ORDER_ITEM_QUANTITY_MAX, ORDER_ITEMS_MAX } from '@/contexts/order';
import * as z from 'zod/mini';

const SaleItemFormSchema = z.object({
    itemKey: z.string().check(z.minLength(1, 'Выберите товар')),
    quantity: z.int().check(z.gte(1), z.lte(ORDER_ITEM_QUANTITY_MAX)),
    unitPriceAmount: moneyAmountSchema,
});

export const CreateSaleFormSchema = z.object({
    clientId: z.string(),
    customerName: z.optional(z.string().check(z.maxLength(LABEL_MAX))),
    customerPhone: z.optional(z.string().check(z.maxLength(PHONE_MAX))),
    items: z
        .array(SaleItemFormSchema)
        .check(
            z.minLength(1, 'Добавьте хотя бы одну позицию'),
            z.maxLength(ORDER_ITEMS_MAX),
        ),
    notes: z.optional(z.string().check(z.maxLength(DESCRIPTION_LONG_MAX))),
});

export type CreateSaleFormValues = z.input<typeof CreateSaleFormSchema>;
