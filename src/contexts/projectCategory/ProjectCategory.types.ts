import { enumValues } from '@/shared/lib/enum';

export const ProjectCategoryType = {
    PRODUCT: 'product',
    SERVICE: 'service',
    GENERIC: 'generic',
} as const;

export type ProjectCategoryType =
    (typeof ProjectCategoryType)[keyof typeof ProjectCategoryType];

export const PROJECT_CATEGORY_TYPE_VALUES = enumValues(ProjectCategoryType);
