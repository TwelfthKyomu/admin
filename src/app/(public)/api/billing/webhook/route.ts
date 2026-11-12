import { HTTP } from '@/shared/constants/http';
import { getErrorMessage } from '@/shared/lib/errors';
import { applyBillingWebhook } from '@/contexts/subscription/SubscriptionBilling.lib';

export const POST = async (request: Request) => {
    const rawBody = await request.text();

    try {
        const outcome = await applyBillingWebhook(
            rawBody,
            request.headers.get('stripe-signature'),
        );

        return Response.json({ outcome });
    } catch (error) {
        return new Response(getErrorMessage(error), {
            status: HTTP.BAD_REQUEST,
        });
    }
};
