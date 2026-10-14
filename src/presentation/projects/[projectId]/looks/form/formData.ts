import type {
    CreateLookActionInputSchema,
    UpdateLookActionInputSchema,
} from '@/contexts/look';
import type * as z from 'zod/mini';

export const LOOK_DEFAULT = {
    title: '',
    description: '',
    image: '',
    isActive: true,
    items: [],
};

export type CreateLookFormValues = z.input<typeof CreateLookActionInputSchema>;
export type UpdateLookFormValues = z.input<typeof UpdateLookActionInputSchema>;
