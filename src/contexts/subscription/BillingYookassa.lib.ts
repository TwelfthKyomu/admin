import 'server-only';

import type { PaymentWebhookEvent } from '@/infrastructure/payments/provider';
import { ApplicationError } from '@/shared/api/errors';
import { DEFAULT_CURRENCY } from '@/shared/constants/currency';
import { PaymentIntentStatus } from '@/contexts/paymentIntent/PaymentIntent.types';
import { env } from '@/env';
import * as z from 'zod/mini';
import type {
    BillingCheckout,
    BillingCheckoutInput,
} from './Subscription.types';

const YOOKASSA_PAYMENTS_URL = 'https://api.yookassa.ru/v3/payments';
const REQUEST_TIMEOUT_MS = 15_000;
const DESCRIPTION_MAX = 128;

const PaymentSchema = z.object({
    id: z.string(),
    status: z.enum(['pending', 'waiting_for_capture', 'succeeded', 'canceled']),
    amount: z.object({ value: z.string(), currency: z.string() }),
    confirmation: z.optional(
        z.object({ confirmation_url: z.optional(z.string()) }),
    ),
});

const NotificationSchema = z.object({
    object: z.object({ id: z.string().check(z.maxLength(64)) }),
});

const STATUS_BY_YOOKASSA = {
    pending: PaymentIntentStatus.PENDING,
    waiting_for_capture: PaymentIntentStatus.PENDING,
    succeeded: PaymentIntentStatus.SUCCEEDED,
    canceled: PaymentIntentStatus.CANCELLED,
};

const authorization = (): string => {
    const shopId = env.BILLING_YOOKASSA_SHOP_ID;
    const secretKey = env.BILLING_YOOKASSA_SECRET_KEY;

    if (!shopId || !secretKey) {
        throw new ApplicationError('Ключи ЮKassa для оплаты тарифов не заданы');
    }

    return `Basic ${Buffer.from(`${shopId}:${secretKey}`).toString('base64')}`;
};

const yookassaRequest = async (path: string, init: RequestInit = {}) => {
    const response = await fetch(`${YOOKASSA_PAYMENTS_URL}${path}`, {
        ...init,
        headers: {
            Authorization: authorization(),
            'Content-Type': 'application/json',
            ...init.headers,
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
        throw new ApplicationError(
            `ЮKassa ответила ошибкой ${response.status}`,
        );
    }

    return z.parse(PaymentSchema, await response.json());
};

const amountValue = (minorUnits: number): string => {
    return (minorUnits / 100).toFixed(2);
};

export const createYookassaCheckout = async (
    input: BillingCheckoutInput,
): Promise<BillingCheckout> => {
    const payment = await yookassaRequest('', {
        method: 'POST',
        headers: { 'Idempotence-Key': crypto.randomUUID() },
        body: JSON.stringify({
            amount: {
                value: amountValue(input.amount),
                currency: DEFAULT_CURRENCY,
            },
            capture: true,
            confirmation: {
                type: 'redirect',
                return_url: `${input.billingUrl}?paid=1`,
            },
            description: input.description.slice(0, DESCRIPTION_MAX),
            metadata: {
                organizationId: input.organizationId,
                plan: input.plan,
            },
        }),
    });

    const url = payment.confirmation?.confirmation_url;

    if (!url) throw new ApplicationError('ЮKassa не вернула ссылку на оплату');

    return { mode: 'redirect', sessionId: payment.id, url };
};

export const parseYookassaBillingWebhook = async (
    rawBody: string,
): Promise<PaymentWebhookEvent> => {
    const notification = z.safeParse(NotificationSchema, JSON.parse(rawBody));

    if (!notification.success) {
        return { providerPaymentId: '', status: PaymentIntentStatus.PENDING };
    }

    const payment = await yookassaRequest(
        `/${encodeURIComponent(notification.data.object.id)}`,
    );

    return {
        providerPaymentId: payment.id,
        status: STATUS_BY_YOOKASSA[payment.status],
        amount: Math.round(Number(payment.amount.value) * 100),
        currency: payment.amount.currency,
    };
};
