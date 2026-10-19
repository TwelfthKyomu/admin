import {
    DESCRIPTION_LONG_MAX,
    LABEL_MAX,
    PHONE_MAX,
    REASON_MAX,
} from '@/shared/constants';
import { CURRENCY_VALUES } from '@/shared/constants/currency';
import {
    entityInProjectSchema,
    idSchema,
    moneyAmountSchema,
    positiveIntSchema,
} from '@/shared/validation/base';
import { PAYMENT_METHOD_VALUES } from '@/contexts/payment/Payment.types';
import { PRODUCT_TYPE_VALUES } from '@/contexts/product/Product.types';
import * as z from 'zod/mini';
import {
    ORDER_ITEM_QUANTITY_MAX,
    ORDER_ITEMS_MAX,
    ORDER_STATUS_VALUES,
} from './Order.types';

const CustomerEmailSchema = z.email().check(z.maxLength(LABEL_MAX));

const OrderItemInputSchema = z.object({
    productId: z.nullish(idSchema),
    variantId: z.nullish(idSchema),
    name: z.string().check(z.minLength(1), z.maxLength(LABEL_MAX)),
    type: z.enum(PRODUCT_TYPE_VALUES),
    unitPriceAmount: moneyAmountSchema,
    quantity: z.int().check(z.gte(1), z.lte(ORDER_ITEM_QUANTITY_MAX)),
});

export type OrderItemInput = z.infer<typeof OrderItemInputSchema>;

export const CreateOrderActionInputSchema = z.object({
    projectId: idSchema,
    clientId: z.nullish(idSchema),
    customerName: z.optional(z.string().check(z.maxLength(LABEL_MAX))),
    customerPhone: z.optional(z.string().check(z.maxLength(PHONE_MAX))),
    customerEmail: z.optional(CustomerEmailSchema),
    currency: z.optional(z.enum(CURRENCY_VALUES)),
    items: z.optional(
        z.array(OrderItemInputSchema).check(z.maxLength(ORDER_ITEMS_MAX)),
    ),
    discountAmount: z.optional(moneyAmountSchema),
    notes: z.optional(z.string().check(z.maxLength(DESCRIPTION_LONG_MAX))),
});

export const ChangeOrderStatusActionInputSchema = z.object({
    id: idSchema,
    projectId: idSchema,
    nextStatus: z.enum(ORDER_STATUS_VALUES),
    reason: z.optional(z.string().check(z.maxLength(REASON_MAX))),
});

export const ChangeOrderSellerActionInputSchema = z.object({
    id: idSchema,
    projectId: idSchema,
    sellerId: z.nullable(idSchema),
});

export const RecordOrderPaymentActionInputSchema = z.object({
    id: idSchema,
    projectId: idSchema,
    amount: positiveIntSchema,
    method: z.optional(z.enum(PAYMENT_METHOD_VALUES)),
});

export const RecordOrderRefundActionInputSchema = z.object({
    id: idSchema,
    projectId: idSchema,
    amount: positiveIntSchema,
    method: z.optional(z.enum(PAYMENT_METHOD_VALUES)),
    reason: z.optional(z.string().check(z.maxLength(REASON_MAX))),
});

export const OrdersActionInputSchema = z.object({
    projectId: idSchema,
    statuses: z.optional(z.array(z.enum(ORDER_STATUS_VALUES))),
    search: z.optional(z.string().check(z.maxLength(LABEL_MAX))),
    from: z.optional(z.coerce.date()),
    to: z.optional(z.coerce.date()),
    clientId: z.optional(idSchema),
    sellerId: z.optional(idSchema),
});

export const OrderDetailActionInputSchema = entityInProjectSchema;

export const EmployeeRevenueActionInputSchema = z.object({
    projectId: idSchema,
    from: z.coerce.date(),
    to: z.coerce.date(),
});

export const MyDayActionInputSchema = z.object({
    from: z.coerce.date(),
    to: z.coerce.date(),
});
