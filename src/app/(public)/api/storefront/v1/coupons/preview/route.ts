import {
    authenticateStorefront,
    parseStorefrontBody,
    storefrontResponse,
} from '@/contexts/storefront/Storefront.lib';
import { StorefrontCouponPreviewInputSchema } from '@/contexts/storefront/Storefront.schema';
import { previewStorefrontCoupon } from '@/contexts/storefront/StorefrontOrder.lib';

export function POST(request: Request) {
    return storefrontResponse(async () => {
        const access = await authenticateStorefront(
            request,
            'storefront:order',
        );

        return previewStorefrontCoupon(
            access,
            await parseStorefrontBody(
                request,
                StorefrontCouponPreviewInputSchema,
            ),
        );
    });
}
