import { HTTP } from '@/shared/constants/http';
import {
    authenticateStorefront,
    parseStorefrontBody,
    storefrontResponse,
} from '@/contexts/storefront/Storefront.lib';
import { StorefrontOrderInputSchema } from '@/contexts/storefront/Storefront.schema';
import { createStorefrontOrder } from '@/contexts/storefront/StorefrontOrder.lib';

export function POST(request: Request) {
    return storefrontResponse(async () => {
        const access = await authenticateStorefront(
            request,
            'storefront:order',
        );

        return createStorefrontOrder(
            access,
            await parseStorefrontBody(request, StorefrontOrderInputSchema),
        );
    }, HTTP.CREATED);
}
