import type { NullToOptional } from '@/shared/lib/optional';
import type { ProjectCategoryView as ServerProjectCategoryView } from './ProjectCategories.table';

export * from './ProjectCategory.actions';
export * from './ProjectCategory.schema';
export * from './ProjectCategory.types';
export * from './useProjectCategories';

export type ProjectCategoryView = NullToOptional<ServerProjectCategoryView>;
