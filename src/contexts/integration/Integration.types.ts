import { enumValues } from '@/shared/lib/enum';
import type { ProjectIntegrationRecord } from './Integrations.table';

export const IntegrationType = {
    STOREFRONT: 'storefront',
    PAYMENT_PROVIDER: 'payment_provider',
    STORAGE: 'storage',
} as const;

export type IntegrationType =
    (typeof IntegrationType)[keyof typeof IntegrationType];

export const INTEGRATION_TYPE_VALUES = enumValues(IntegrationType);

export const INTEGRATION_API_KEY_PREFIX = 'eb_live_';
export const INTEGRATION_API_KEY_ENTROPY_BYTES = 24;

export type IntegrationView = Pick<
    ProjectIntegrationRecord,
    'id' | 'name' | 'siteUrl' | 'type' | 'isActive' | 'createdAt'
> & {
    apiKeyPrefix: string | null;
};
