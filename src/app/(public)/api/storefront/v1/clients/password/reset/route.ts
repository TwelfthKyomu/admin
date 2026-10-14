import {
    authenticateStorefront,
    parseStorefrontBody,
    storefrontResponse,
} from '@/contexts/storefront/Storefront.lib';
import { StorefrontPasswordResetInputSchema } from '@/contexts/storefront/Storefront.schema';
import { resetStorefrontPassword } from '@/contexts/storefront/StorefrontClient.lib';

export function POST(request: Request) {
    return storefrontResponse(async () =>
        resetStorefrontPassword(
            await authenticateStorefront(request, 'storefront:read'),
            await parseStorefrontBody(
                request,
                StorefrontPasswordResetInputSchema,
            ),
        ),
    );
}
