import type {
    CreateClientActionInputSchema,
    UpdateClientActionInputSchema,
} from '@/contexts/client';
import type * as z from 'zod/mini';

export const CLIENT_DEFAULT = {
    firstName: '',
    lastName: '',
    middleName: '',
    email: '',
    phone: '',
};

export type CreateClientFormValues = z.input<
    typeof CreateClientActionInputSchema
>;

export type UpdateClientFormValues = z.input<
    typeof UpdateClientActionInputSchema
>;
