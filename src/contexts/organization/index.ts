import type { NullToOptional } from '@/shared/lib/optional';
import type { UserOrganizationView as ServerUserOrganizationView } from './Organizations.table';

export * from './Organization.actions';
export * from './Organization.schema';
export * from './useOrganizations';

export type UserOrganizationView = NullToOptional<ServerUserOrganizationView>;
