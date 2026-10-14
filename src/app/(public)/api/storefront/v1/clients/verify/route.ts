import {
    authenticateStorefront,
    parseStorefrontBody,
    storefrontResponse,
} from '@/contexts/storefront/Storefront.lib';
import { StorefrontVerifyInputSchema } from '@/contexts/storefront/Storefront.schema';
import { verifyStorefrontClient } from '@/contexts/storefront/StorefrontClient.lib';

export function POST(request: Request) {
    return storefrontResponse(async () =>
        verifyStorefrontClient(
            await authenticateStorefront(request, 'storefront:read'),
            await parseStorefrontBody(request, StorefrontVerifyInputSchema),
        ),
    );
}
