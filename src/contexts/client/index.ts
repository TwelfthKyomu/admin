import type { NullToOptional } from '@/shared/lib/optional';
import type { ClientView as ClientRecordView } from './Clients.table';

export * from './Client.actions';
export * from './Client.schema';
export * from './useClients';

export type ClientView = NullToOptional<ClientRecordView>;
