import { DEFAULT_CURRENCY } from '@/shared/constants';
import { KEY_MAX, KEY_MIN } from '@/shared/constants/default';
import { slugify } from '@/shared/format/url';
import {
    type CreateProjectActionInputSchema,
    ProjectType,
    type UpdateProjectActionInputSchema,
} from '@/contexts/project';
import type * as z from 'zod/mini';

export type CreateProjectFormValues = z.input<
    typeof CreateProjectActionInputSchema
>;

export type UpdateProjectFormValues = z.input<
    typeof UpdateProjectActionInputSchema
>;

export const PROJECT_DEFAULT = {
    name: '',
    slug: '',
    key: '',
    type: ProjectType.SHOP,
    description: '',
    color: '',
    defaultCurrency: DEFAULT_CURRENCY,
};

export function deriveProjectKey(name: string): string {
    const key = slugify(name)
        .replace(/[^a-z]/g, '')
        .toUpperCase()
        .slice(0, KEY_MAX);

    return key.length >= KEY_MIN ? key : '';
}
