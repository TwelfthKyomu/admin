import { enumValues } from '@/shared/lib/enum';

export const PaymentIntentStatus = {
    PENDING: 'pending',
    SUCCEEDED: 'succeeded',
    CANCELLED: 'cancelled',
} as const;

export type PaymentIntentStatus =
    (typeof PaymentIntentStatus)[keyof typeof PaymentIntentStatus];

export const PAYMENT_INTENT_STATUS_VALUES = enumValues(PaymentIntentStatus);

export const PaymentProvider = {
    YOOKASSA: 'yookassa',
    CLOUDPAYMENTS: 'cloudpayments',
    STRIPE: 'stripe',
} as const;

export type PaymentProvider =
    (typeof PaymentProvider)[keyof typeof PaymentProvider];

export const PAYMENT_PROVIDER_VALUES = enumValues(PaymentProvider);
