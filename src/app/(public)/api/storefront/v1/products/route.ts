import { PRODUCT_TYPE_VALUES } from '@/contexts/product/Product.types';
import {
    authenticateStorefront,
    storefrontResponse,
} from '@/contexts/storefront/Storefront.lib';
import { CATALOG_SORT_VALUES } from '@/contexts/storefront/Storefront.types';
import { loadStorefrontCatalog } from '@/contexts/storefront/StorefrontCatalog.lib';
import { connection } from 'next/server';

export async function GET(request: Request) {
    await connection();

    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page');
    const limit = searchParams.get('limit');
    const categorySlug = searchParams.get('categorySlug');
    const featured = searchParams.get('featured');
    const type = searchParams.get('type');
    const sort = searchParams.get('sort');

    const options = {
        page: page ? Number.parseInt(page, 10) : undefined,
        limit: limit ? Number.parseInt(limit, 10) : undefined,
        categorySlug: categorySlug ?? undefined,
        featured: featured === 'true' ? true : undefined,
        type: PRODUCT_TYPE_VALUES.find((value) => value === type),
        search: searchParams.get('search') ?? undefined,
        inStock: searchParams.get('inStock') === 'true' ? true : undefined,
        sort: CATALOG_SORT_VALUES.find((value) => value === sort),
    };

    return storefrontResponse(async () =>
        loadStorefrontCatalog(
            await authenticateStorefront(request, 'storefront:read'),
            options,
        ),
    );
}
