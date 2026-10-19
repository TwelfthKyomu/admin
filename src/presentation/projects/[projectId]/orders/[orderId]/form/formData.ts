import { REASON_MAX } from '@/shared/constants/default';
import {
    DELIVERY_ADDRESS_MAX,
    DELIVERY_CARRIER_VALUES,
    DELIVERY_KIND_VALUES,
} from '@/contexts/delivery';
import { PAYMENT_METHOD_VALUES } from '@/contexts/payment';
import * as z from 'zod/mini';

export const TO_QUEUE = '__queue__';

const positiveAmount = z
    .nullable(z.number())
    .check(
        z.refine(
            (value) => value !== null && value > 0,
            'Сумма должна быть больше 0',
        ),
    );

export const PaymentFormSchema = z.object({
    amount: positiveAmount,
    method: z.optional(z.enum(PAYMENT_METHOD_VALUES)),
    reason: z.optional(z.string().check(z.maxLength(REASON_MAX))),
});

export type PaymentFormValues = z.input<typeof PaymentFormSchema>;

export const DeliveryFormSchema = z.object({
    kind: z.enum(DELIVERY_KIND_VALUES),
    address: z.string().check(z.maxLength(DELIVERY_ADDRESS_MAX)),
    recipientName: z.string().check(z.maxLength(255)),
    recipientPhone: z.string().check(z.maxLength(32)),
    windowDate: z.optional(z.date()),
    windowFrom: z.string(),
    windowTo: z.string(),
    cashDue: z.nullable(z.number()),
    courierId: z.string(),
    carrier: z.enum(DELIVERY_CARRIER_VALUES),
    trackingNumber: z.string().check(z.maxLength(120)),
});

export type DeliveryFormValues = z.input<typeof DeliveryFormSchema>;

export const OnlinePaymentFormSchema = z.object({
    integrationId: z.string().check(z.minLength(1, 'Выберите провайдера')),
    amount: positiveAmount,
});

export type OnlinePaymentFormValues = z.input<typeof OnlinePaymentFormSchema>;

export const NO_SELLER = '__none__';

export const OrderSellerFormSchema = z.object({
    sellerId: z.string(),
});

export type OrderSellerFormValues = z.input<typeof OrderSellerFormSchema>;
