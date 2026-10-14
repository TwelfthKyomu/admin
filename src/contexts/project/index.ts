import type { NullToOptional } from '@/shared/lib/optional';
import type { ProjectView as ServerProjectView } from './Projects.table';

export * from './Project.actions';
export * from './Project.schema';
export * from './Project.types';
export * from './useProjects';

export type ProjectView = NullToOptional<ServerProjectView>;
