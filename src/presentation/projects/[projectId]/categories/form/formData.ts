import { NONE } from '@/shared/lib/none';
import {
    type CreateCategoryActionInputSchema,
    ProjectCategoryType,
    type UpdateCategoryActionInputSchema,
} from '@/contexts/projectCategory';
import type * as z from 'zod/mini';

export const CATEGORY_DEFAULT = {
    name: '',
    parentId: NONE,
    type: ProjectCategoryType.PRODUCT,
};

export type CreateCategoryFormValues = z.input<
    typeof CreateCategoryActionInputSchema
>;
export type UpdateCategoryFormValues = z.input<
    typeof UpdateCategoryActionInputSchema
>;
