import 'server-only';

import type {
    CreatePaymentInput,
    CreatePaymentOutput,
    PaymentProviderCredentials,
    PaymentWebhookEvent,
    RefundInput,
    RefundOutput,
} from '@/infrastructure/payments/provider';
import { ApplicationError } from '@/shared/api/errors';
import { PaymentIntentStatus } from '@/contexts/paymentIntent/PaymentIntent.types';
import { addMinutes, getUnixTime, max } from 'date-fns';
import Stripe from 'stripe';

const CHECKOUT_MIN_LIFETIME_MINUTES = 31;

export async function withStripeErrors<T>(request: Promise<T>): Promise<T> {
    try {
        return await request;
    } catch (error) {
        if (error instanceof Stripe.errors.StripeError) {
            throw new ApplicationError(`Stripe: ${error.message}`);
        }

        throw error;
    }
}

function sessionEvent(
    event: Stripe.Event,
    session: Stripe.Checkout.Session,
    status: PaymentIntentStatus,
): PaymentWebhookEvent {
    return {
        providerPaymentId: session.id,
        amount: session.amount_total ?? undefined,
        currency: session.currency?.toUpperCase(),
        status,
        raw: { eventId: event.id, eventType: event.type },
    };
}

export function toWebhookEvent(event: Stripe.Event): PaymentWebhookEvent {
    switch (event.type) {
        case 'checkout.session.completed':
        case 'checkout.session.async_payment_succeeded':
            return sessionEvent(
                event,
                event.data.object,
                event.data.object.payment_status === 'paid'
                    ? PaymentIntentStatus.SUCCEEDED
                    : PaymentIntentStatus.PENDING,
            );
        case 'checkout.session.async_payment_failed':
        case 'checkout.session.expired':
            return sessionEvent(
                event,
                event.data.object,
                PaymentIntentStatus.CANCELLED,
            );
        default:
            return {
                providerPaymentId: '',
                status: PaymentIntentStatus.PENDING,
            };
    }
}

function checkoutExpiresAt(expiresAt: Date): number {
    return getUnixTime(
        max([expiresAt, addMinutes(new Date(), CHECKOUT_MIN_LIFETIME_MINUTES)]),
    );
}

function clientFor(credentials: PaymentProviderCredentials): {
    stripe: Stripe;
    webhookSecret?: string;
} {
    const { secretKey, webhookSecret } = credentials.payload;

    if (typeof secretKey !== 'string' || !secretKey) {
        throw new ApplicationError('Stripe: не задан секретный ключ');
    }

    return {
        stripe: new Stripe(secretKey),
        webhookSecret:
            typeof webhookSecret === 'string' && webhookSecret
                ? webhookSecret
                : undefined,
    };
}

export async function createStripePayment(
    credentials: PaymentProviderCredentials,
    input: CreatePaymentInput,
): Promise<CreatePaymentOutput> {
    const { stripe } = clientFor(credentials);
    const { intent } = input;

    const session = await withStripeErrors(
        stripe.checkout.sessions.create(
            {
                mode: 'payment',
                client_reference_id: intent.id,
                success_url: input.returnUrl,
                cancel_url: input.returnUrl,
                line_items: [
                    {
                        quantity: 1,
                        price_data: {
                            currency: intent.currency.toLowerCase(),
                            unit_amount: intent.amount,
                            product_data: {
                                name: input.description ?? 'Оплата заказа',
                            },
                        },
                    },
                ],
                metadata: { intentId: intent.id },
                payment_intent_data: { metadata: { intentId: intent.id } },
                ...(input.expiresAt
                    ? { expires_at: checkoutExpiresAt(input.expiresAt) }
                    : {}),
            },
            { idempotencyKey: intent.idempotenceKey ?? intent.id },
        ),
    );

    return {
        providerPaymentId: session.id,
        confirmationUrl: session.url,
        metadata:
            typeof session.payment_intent === 'string'
                ? { stripePaymentIntentId: session.payment_intent }
                : undefined,
    };
}

export async function parseStripeWebhook(
    credentials: PaymentProviderCredentials,
    request: { rawBody: string; headers: Record<string, string> },
): Promise<PaymentWebhookEvent> {
    const { stripe, webhookSecret } = clientFor(credentials);

    if (webhookSecret) {
        return toWebhookEvent(
            stripe.webhooks.constructEvent(
                request.rawBody,
                request.headers['stripe-signature'] ?? '',
                webhookSecret,
            ),
        );
    }

    const { id } = JSON.parse(request.rawBody) as { id?: unknown };

    if (typeof id !== 'string' || !id.startsWith('evt_')) {
        throw new ApplicationError('Stripe: некорректный id события');
    }

    return toWebhookEvent(await withStripeErrors(stripe.events.retrieve(id)));
}

export async function refundStripePayment(
    credentials: PaymentProviderCredentials,
    input: RefundInput,
): Promise<RefundOutput> {
    const { stripe } = clientFor(credentials);
    const sessionId = input.intent.providerPaymentId;

    if (!sessionId) {
        throw new ApplicationError(
            'Stripe: платёж не зарегистрирован у провайдера',
        );
    }

    const fromMetadata = input.intent.metadata?.stripePaymentIntentId;

    const paymentIntent =
        typeof fromMetadata === 'string' && fromMetadata
            ? fromMetadata
            : (
                  await withStripeErrors(
                      stripe.checkout.sessions.retrieve(sessionId),
                  )
              ).payment_intent;

    if (!paymentIntent) {
        throw new ApplicationError(
            'Stripe: не найден payment_intent для возврата',
        );
    }

    const refund = await withStripeErrors(
        stripe.refunds.create(
            {
                payment_intent:
                    typeof paymentIntent === 'string'
                        ? paymentIntent
                        : paymentIntent.id,
                amount: input.amount,
                metadata: input.reason ? { reason: input.reason } : undefined,
            },
            { idempotencyKey: input.idempotenceKey },
        ),
    );

    return { providerRefundId: refund.id };
}
