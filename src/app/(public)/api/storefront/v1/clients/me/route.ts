import {
    authenticateStorefront,
    storefrontResponse,
} from '@/contexts/storefront/Storefront.lib';
import { CLIENT_SESSION_HEADER } from '@/contexts/storefront/Storefront.types';
import { loadStorefrontClient } from '@/contexts/storefront/StorefrontClient.lib';
import { connection } from 'next/server';

export async function GET(request: Request) {
    await connection();

    return storefrontResponse(async () =>
        loadStorefrontClient(
            await authenticateStorefront(request, 'storefront:read'),
            request.headers.get(CLIENT_SESSION_HEADER) ?? '',
        ),
    );
}
