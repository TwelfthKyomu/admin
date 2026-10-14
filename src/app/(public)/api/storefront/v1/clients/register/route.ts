import {
    authenticateStorefront,
    parseStorefrontBody,
    storefrontResponse,
} from '@/contexts/storefront/Storefront.lib';
import { StorefrontRegisterInputSchema } from '@/contexts/storefront/Storefront.schema';
import { registerStorefrontClient } from '@/contexts/storefront/StorefrontClient.lib';

export function POST(request: Request) {
    return storefrontResponse(async () =>
        registerStorefrontClient(
            await authenticateStorefront(request, 'storefront:read'),
            await parseStorefrontBody(request, StorefrontRegisterInputSchema),
        ),
    );
}
