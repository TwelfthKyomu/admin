import {
    authenticateStorefront,
    storefrontResponse,
} from '@/contexts/storefront/Storefront.lib';
import { loadStorefrontOrder } from '@/contexts/storefront/StorefrontOrder.lib';
import { connection } from 'next/server';

interface RouteContext {
    params: Promise<{ orderId: string }>;
}

export async function GET(request: Request, context: RouteContext) {
    await connection();

    return storefrontResponse(async () => {
        const access = await authenticateStorefront(request, 'storefront:read');
        const { orderId } = await context.params;

        return loadStorefrontOrder(access, orderId);
    });
}
