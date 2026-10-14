import { CURRENCY_VALUES } from '@/shared/constants/currency';
import { LABEL_MAX } from '@/shared/constants/default';
import {
    entityInProjectSchema,
    idSchema,
    positiveIntSchema,
} from '@/shared/validation/base';
import * as z from 'zod/mini';
import { PAYMENT_PROVIDER_VALUES } from './PaymentIntent.types';

export const ConnectPaymentProviderActionInputSchema = z.object({
    projectId: idSchema,
    name: z.string().check(z.minLength(1), z.maxLength(LABEL_MAX)),
    provider: z.enum(PAYMENT_PROVIDER_VALUES),

    payload: z.record(z.string(), z.unknown()),
});

export const CreatePaymentIntentActionInputSchema = z.object({
    projectId: idSchema,
    integrationId: idSchema,
    orderId: idSchema,
    amount: positiveIntSchema,
    currency: z.enum(CURRENCY_VALUES),
    returnUrl: z.url(),
    description: z.optional(z.string().check(z.maxLength(LABEL_MAX))),
});

export const PaymentIntentsActionInputSchema = z.object({
    projectId: idSchema,
    orderId: z.optional(idSchema),
});

export const RefundUnappliedIntentActionInputSchema = entityInProjectSchema;
