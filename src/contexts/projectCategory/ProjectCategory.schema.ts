import { LABEL_MAX, SLUG_MAX } from '@/shared/constants/default';
import { SLUG_PATTERN } from '@/shared/validation';
import { entityInProjectSchema, idSchema } from '@/shared/validation/base';
import * as z from 'zod/mini';
import { PROJECT_CATEGORY_TYPE_VALUES } from './ProjectCategory.types';

const NameSchema = z.string().check(z.minLength(1), z.maxLength(LABEL_MAX));

const SlugSchema = z
    .string()
    .check(z.minLength(1), z.maxLength(SLUG_MAX), z.regex(SLUG_PATTERN));

export const CreateCategoryActionInputSchema = z.object({
    projectId: idSchema,
    parentId: z.nullish(idSchema),
    name: NameSchema,
    slug: z.optional(SlugSchema),
    type: z.optional(z.enum(PROJECT_CATEGORY_TYPE_VALUES)),
    position: z.optional(z.int().check(z.gte(0))),
});

export const UpdateCategoryActionInputSchema = z.object({
    id: idSchema,
    projectId: idSchema,
    parentId: z.nullish(idSchema),
    name: z.optional(NameSchema),
    slug: z.optional(SlugSchema),
    type: z.optional(z.enum(PROJECT_CATEGORY_TYPE_VALUES)),
    isActive: z.optional(z.boolean()),
});

export const DeleteCategoryActionInputSchema = entityInProjectSchema;

export const CategoriesActionInputSchema = z.object({
    projectId: idSchema,
    includeInactive: z.optional(z.boolean()),
});
