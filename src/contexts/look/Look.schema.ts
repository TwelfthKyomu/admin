import { DESCRIPTION_SHORT_MAX, TITLE_MAX } from '@/shared/constants/default';
import { imageUrlField, textField } from '@/shared/validation';
import {
    entityInProjectSchema,
    idSchema,
    optionalText,
} from '@/shared/validation/base';
import * as z from 'zod/mini';
import { LOOK_ITEMS_MAX, LOOK_POINT_MAX } from './Look.types';

const PointSchema = z.int().check(z.gte(0), z.lte(LOOK_POINT_MAX));

const LookFieldsSchema = z.object({
    projectId: idSchema,
    title: textField(TITLE_MAX),
    description: optionalText(
        z.string().check(z.maxLength(DESCRIPTION_SHORT_MAX)),
    ),
    image: imageUrlField,
    isActive: z.optional(z.boolean()),
    items: z
        .array(
            z.object({
                productId: idSchema,
                x: PointSchema,
                y: PointSchema,
            }),
        )
        .check(z.maxLength(LOOK_ITEMS_MAX)),
});

export const LooksActionInputSchema = z.object({ projectId: idSchema });

export const CreateLookActionInputSchema = LookFieldsSchema;

export const UpdateLookActionInputSchema = z.extend(LookFieldsSchema, {
    id: idSchema,
});

export const DeleteLookActionInputSchema = entityInProjectSchema;
