import type { PaymentWebhookEvent } from '@/infrastructure/payments/provider';
import { parseStripeWebhook } from '@/infrastructure/payments/stripe';
import { HTTP } from '@/shared/constants/http';
import { getErrorMessage } from '@/shared/lib/errors';
import {
    applyPaymentWebhookEvent,
    getProviderCredentials,
} from '@/contexts/paymentIntent/PaymentIntent.lib';

interface RouteContext {
    params: Promise<{ integrationId: string }>;
}

export async function POST(request: Request, context: RouteContext) {
    const { integrationId } = await context.params;

    const credentials = await getProviderCredentials(integrationId);

    if (!credentials) {
        return new Response('Not found', { status: HTTP.NOT_FOUND });
    }

    const rawBody = await request.text();
    const headers: Record<string, string> = {};

    request.headers.forEach((value, key) => {
        headers[key.toLowerCase()] = value;
    });

    let event: PaymentWebhookEvent;

    try {
        event = await parseStripeWebhook(credentials, { rawBody, headers });
    } catch (error) {
        return new Response(getErrorMessage(error), {
            status: HTTP.BAD_REQUEST,
        });
    }

    const outcome = await applyPaymentWebhookEvent(integrationId, event);

    return Response.json({ outcome });
}
