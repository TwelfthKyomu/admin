import {
    authenticateStorefront,
    storefrontResponse,
} from '@/contexts/storefront/Storefront.lib';
import { loadStorefrontLooks } from '@/contexts/storefront/StorefrontLook.lib';
import { connection } from 'next/server';

export const GET = async (request: Request) => {
    await connection();

    return storefrontResponse(async () =>
        loadStorefrontLooks(
            await authenticateStorefront(request, 'storefront:read'),
        ),
    );
};
