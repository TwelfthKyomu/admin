import type { NullToOptional } from '@/shared/lib/optional';
import type { ProjectBadgeView as ServerProjectBadgeView } from './ProjectBadges.table';

export * from './ProjectBadge.actions';
export * from './ProjectBadge.schema';
export * from './ProjectBadge.types';
export * from './useProjectBadges';

export type ProjectBadgeView = NullToOptional<ServerProjectBadgeView>;
