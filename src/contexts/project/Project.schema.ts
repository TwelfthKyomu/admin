import { CURRENCY_VALUES } from '@/shared/constants/currency';
import { KEY_MAX, KEY_MIN, LABEL_MAX } from '@/shared/constants/default';
import {
    hexColorField,
    slugField,
    textField,
    upperKeyField,
} from '@/shared/validation';
import { idSchema, optionalText } from '@/shared/validation/base';
import * as z from 'zod/mini';
import { PROJECT_TYPE_VALUES } from './Project.types';

const PROJECT_SLUG_MAX = 100;

const ProjectFields = {
    name: textField(LABEL_MAX),
    type: z.optional(z.enum(PROJECT_TYPE_VALUES)),
    slug: slugField(PROJECT_SLUG_MAX),
    key: upperKeyField(KEY_MIN, KEY_MAX),
    description: z.optional(z.string()),
    color: optionalText(hexColorField),
    defaultCurrency: z.optional(z.enum(CURRENCY_VALUES)),
};

export const CreateProjectActionInputSchema = z.object(ProjectFields);

export const UpdateProjectActionInputSchema = z.object({
    id: idSchema,
    ...ProjectFields,
});

export const DeleteProjectActionInputSchema = z.object({
    id: idSchema,
});

export const ProjectsActionInputSchema = z.object({
    organizationId: idSchema,
});
