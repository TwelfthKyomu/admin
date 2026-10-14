import {
    authenticateStorefront,
    parseStorefrontBody,
    storefrontResponse,
} from '@/contexts/storefront/Storefront.lib';
import { StorefrontPasswordForgotInputSchema } from '@/contexts/storefront/Storefront.schema';
import { requestStorefrontPasswordReset } from '@/contexts/storefront/StorefrontClient.lib';

export function POST(request: Request) {
    return storefrontResponse(async () =>
        requestStorefrontPasswordReset(
            await authenticateStorefront(request, 'storefront:read'),
            await parseStorefrontBody(
                request,
                StorefrontPasswordForgotInputSchema,
            ),
        ),
    );
}
