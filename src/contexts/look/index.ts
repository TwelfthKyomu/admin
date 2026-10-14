import type { NullToOptional } from '@/shared/lib/optional';
import type { ProjectLookView } from './Looks.table';

export * from './Look.actions';
export * from './Look.schema';
export * from './Look.types';
export * from './useLooks';

export type LookView = NullToOptional<ProjectLookView>;
