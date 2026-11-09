import { NAME_MAX } from '@/shared/constants/default';
import { textField } from '@/shared/validation';
import {
    entityInProjectSchema,
    idSchema,
    nonNegativeIntSchema,
    projectScopeSchema,
} from '@/shared/validation/base';
import * as z from 'zod/mini';

const NameSchema = textField(NAME_MAX);

export const WarehousesActionInputSchema = projectScopeSchema;

export const CreateWarehouseActionInputSchema = z.object({
    projectId: idSchema,
    name: NameSchema,
    forSite: z.boolean(),
});

export const UpdateWarehouseActionInputSchema = z.object({
    id: idSchema,
    projectId: idSchema,
    name: z.optional(NameSchema),
    forSite: z.optional(z.boolean()),
    position: z.optional(nonNegativeIntSchema),
});

export const DeleteWarehouseActionInputSchema = entityInProjectSchema;
