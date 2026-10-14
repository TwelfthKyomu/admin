import {
    authenticateStorefront,
    StorefrontNotFoundError,
    storefrontResponse,
} from '@/contexts/storefront/Storefront.lib';
import { loadStorefrontCatalog } from '@/contexts/storefront/StorefrontCatalog.lib';
import { connection } from 'next/server';

interface RouteContext {
    params: Promise<{ slug: string }>;
}

export async function GET(request: Request, context: RouteContext) {
    await connection();

    return storefrontResponse(async () => {
        const { slug } = await context.params;

        const { currency, categories, products } = await loadStorefrontCatalog(
            await authenticateStorefront(request, 'storefront:read'),
            { slug, limit: 1 },
        );

        const [product] = products;

        if (!product) throw new StorefrontNotFoundError('Товар не найден');

        return { currency, categories, product };
    });
}
