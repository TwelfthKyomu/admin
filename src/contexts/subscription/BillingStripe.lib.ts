import 'server-only';

import type { PaymentWebhookEvent } from '@/infrastructure/payments/provider';
import {
    toWebhookEvent,
    withStripeErrors,
} from '@/infrastructure/payments/stripe';
import { ApplicationError } from '@/shared/api/errors';
import { DEFAULT_CURRENCY } from '@/shared/constants/currency';
import { PaymentIntentStatus } from '@/contexts/paymentIntent/PaymentIntent.types';
import { env } from '@/env';
import Stripe from 'stripe';
import type {
    BillingCheckout,
    BillingCheckoutInput,
} from './Subscription.types';

export const hasStripeBillingKeys = (): boolean => {
    return Boolean(
        env.BILLING_STRIPE_SECRET_KEY && env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    );
};

const stripeClient = (): Stripe => {
    if (!hasStripeBillingKeys() || !env.BILLING_STRIPE_SECRET_KEY) {
        throw new ApplicationError(
            'Ключи Stripe для оплаты тарифов не заданы: BILLING_STRIPE_SECRET_KEY и NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
        );
    }

    return new Stripe(env.BILLING_STRIPE_SECRET_KEY);
};

const sessionStatus = (
    session: Stripe.Checkout.Session,
): PaymentIntentStatus => {
    if (session.payment_status === 'paid') return PaymentIntentStatus.SUCCEEDED;
    if (session.status === 'expired') return PaymentIntentStatus.CANCELLED;

    return PaymentIntentStatus.PENDING;
};

export const createStripeCheckout = async (
    input: BillingCheckoutInput,
): Promise<BillingCheckout> => {
    const session = await withStripeErrors(
        stripeClient().checkout.sessions.create({
            mode: 'payment',
            ui_mode: 'embedded_page',
            redirect_on_completion: 'if_required',
            return_url: `${input.billingUrl}?session_id={CHECKOUT_SESSION_ID}`,
            client_reference_id: input.organizationId,
            line_items: [
                {
                    quantity: 1,
                    price_data: {
                        currency: DEFAULT_CURRENCY.toLowerCase(),
                        unit_amount: input.amount,
                        product_data: { name: input.description },
                    },
                },
            ],
            metadata: {
                organizationId: input.organizationId,
                plan: input.plan,
            },
        }),
    );

    if (!session.client_secret) {
        throw new ApplicationError('Stripe не вернул форму оплаты');
    }

    return {
        mode: 'embedded',
        sessionId: session.id,
        clientSecret: session.client_secret,
    };
};

export const retrieveStripeBillingEvent = async (
    sessionId: string,
): Promise<PaymentWebhookEvent> => {
    const session = await withStripeErrors(
        stripeClient().checkout.sessions.retrieve(sessionId),
    );

    return {
        providerPaymentId: session.id,
        status: sessionStatus(session),
        amount: session.amount_total ?? undefined,
    };
};

export const parseStripeBillingWebhook = (
    rawBody: string,
    signature: string | null,
): PaymentWebhookEvent => {
    const webhookSecret = env.BILLING_STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
        throw new ApplicationError('Не задан BILLING_STRIPE_WEBHOOK_SECRET');
    }

    return toWebhookEvent(
        stripeClient().webhooks.constructEvent(
            rawBody,
            signature ?? '',
            webhookSecret,
        ),
    );
};
