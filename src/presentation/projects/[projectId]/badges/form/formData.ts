import {
    type CreateProjectBadgeActionInputSchema,
    PROJECT_BADGE_DEFAULT_COLOR,
    type UpdateProjectBadgeActionInputSchema,
} from '@/contexts/projectBadge';
import type * as z from 'zod/mini';

export const BADGE_DEFAULT = {
    code: '',
    label: '',
    color: PROJECT_BADGE_DEFAULT_COLOR,
};

export type CreateBadgeFormValues = z.input<
    typeof CreateProjectBadgeActionInputSchema
>;
export type UpdateBadgeFormValues = z.input<
    typeof UpdateProjectBadgeActionInputSchema
>;
