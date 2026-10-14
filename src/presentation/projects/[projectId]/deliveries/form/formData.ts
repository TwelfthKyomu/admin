import { DELIVERY_REASON_MAX } from '@/contexts/delivery';
import { PaymentMethod } from '@/contexts/payment';
import * as z from 'zod/mini';

export const COMPLETE_METHOD_OPTIONS = [
    { value: PaymentMethod.CASH, label: 'Наличными' },
    { value: PaymentMethod.CARD, label: 'Картой' },
] as const;

export const CompleteDeliveryFormSchema = z.object({
    amount: z.nullable(z.number()),
    method: z.enum([PaymentMethod.CASH, PaymentMethod.CARD]),
});

export type CompleteDeliveryFormValues = z.input<
    typeof CompleteDeliveryFormSchema
>;

export const FailDeliveryFormSchema = z.object({
    reason: z
        .string()
        .check(
            z.trim(),
            z.minLength(1, 'Что случилось?'),
            z.maxLength(DELIVERY_REASON_MAX),
        ),
});

export type FailDeliveryFormValues = z.input<typeof FailDeliveryFormSchema>;
