import { CODE_MAX, TITLE_MAX } from '@/shared/constants/default';
import {
    hexColorAlphaField,
    lowerCodeField,
    textField,
} from '@/shared/validation';
import {
    entityInProjectSchema,
    idSchema,
    nonNegativeIntSchema,
} from '@/shared/validation/base';
import * as z from 'zod/mini';

const CodeSchema = lowerCodeField(CODE_MAX);
const LabelSchema = textField(TITLE_MAX);
const ColorSchema = hexColorAlphaField;

export const CreateProjectBadgeActionInputSchema = z.object({
    projectId: idSchema,
    code: z.optional(CodeSchema),
    label: LabelSchema,
    color: z.optional(ColorSchema),
    position: z.optional(nonNegativeIntSchema),
    isActive: z.optional(z.boolean()),
});

export const UpdateProjectBadgeActionInputSchema = z.object({
    id: idSchema,
    projectId: idSchema,
    label: z.optional(LabelSchema),
    color: z.optional(ColorSchema),
    position: z.optional(nonNegativeIntSchema),
    isActive: z.optional(z.boolean()),
});

export const DeleteProjectBadgeActionInputSchema = entityInProjectSchema;

export const ProjectBadgesActionInputSchema = z.object({
    projectId: idSchema,
    includeInactive: z.optional(z.boolean()),
});
