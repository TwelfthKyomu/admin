import { PRODUCT_TYPE_VALUES } from '@/contexts/product/Product.types';
import {
    authenticateStorefront,
    storefrontResponse,
} from '@/contexts/storefront/Storefront.lib';
import { CATALOG_SORT_VALUES } from '@/contexts/storefront/Storefront.types';
import { loadStorefrontCatalog } from '@/contexts/storefront/StorefrontCatalog.lib';
import { connection } from 'next/server';

const MAX_LIMIT = 1000;
const MAX_PAGE = 100_000;
const SEARCH_MAX = 100;

function positiveInt(value: string | null, max: number): number | undefined {
    const parsed = value ? Number(value) : Number.NaN;

    return Number.isInteger(parsed) && parsed > 0
        ? Math.min(parsed, max)
        : undefined;
}

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
        page: positiveInt(page, MAX_PAGE),
        limit: positiveInt(limit, MAX_LIMIT),
        categorySlug: categorySlug ?? undefined,
        featured: featured === 'true' ? true : undefined,
        type: PRODUCT_TYPE_VALUES.find((value) => value === type),
        search: searchParams.get('search')?.slice(0, SEARCH_MAX) || undefined,
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
