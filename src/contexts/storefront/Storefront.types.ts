import type { Currency } from '@/shared/constants/currency';
import { enumValues } from '@/shared/lib/enum';

export const STOREFRONT_IMAGES_PATH = '/api/storefront/v1/images';

export const CLIENT_SESSION_HEADER = 'x-client-session';

export const STOREFRONT_REVALIDATE_PATH = '/api/revalidate';

export const STOREFRONT_SIGNATURE_HEADER = 'x-storefront-signature';

export interface StorefrontAccess {
    integrationId: string;
    projectId: string;
    organizationId: string;
    projectName: string;
    currency: Currency;
}

export function toMajorUnits(amount: number): number {
    return amount / 100;
}

export const CatalogSort = {
    FEATURED: 'featured',
    NEWEST: 'newest',
    PRICE_ASC: 'price_asc',
    PRICE_DESC: 'price_desc',
} as const;

export type CatalogSort = (typeof CatalogSort)[keyof typeof CatalogSort];

export const CATALOG_SORT_VALUES = enumValues(CatalogSort);
