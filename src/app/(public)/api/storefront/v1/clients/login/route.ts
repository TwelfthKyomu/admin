import {
    authenticateStorefront,
    parseStorefrontBody,
    storefrontResponse,
} from '@/contexts/storefront/Storefront.lib';
import { StorefrontLoginInputSchema } from '@/contexts/storefront/Storefront.schema';
import { loginStorefrontClient } from '@/contexts/storefront/StorefrontClient.lib';

export function POST(request: Request) {
    return storefrontResponse(async () =>
        loginStorefrontClient(
            await authenticateStorefront(request, 'storefront:read'),
            await parseStorefrontBody(request, StorefrontLoginInputSchema),
        ),
    );
}
