import type { NullToOptional } from '@/shared/lib/optional';
import type { IntegrationView as ServerIntegrationView } from './Integration.types';

export * from './Integration.actions';
export * from './Integration.schema';
export * from './Integration.types';
export * from './useIntegrations';

export type IntegrationView = NullToOptional<ServerIntegrationView>;
