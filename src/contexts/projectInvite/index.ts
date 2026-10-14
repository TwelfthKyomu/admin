import type { NullToOptional } from '@/shared/lib/optional';
import type {
    InviteStateView as ServerInviteStateView,
    InviteView as ServerInviteView,
} from './ProjectInvite.types';

export * from './ProjectInvite.actions';
export * from './ProjectInvite.schema';
export * from './ProjectInvite.types';
export * from './useProjectInvites';

export type InviteStateView = NullToOptional<ServerInviteStateView>;
export type InviteView = NullToOptional<ServerInviteView>;
