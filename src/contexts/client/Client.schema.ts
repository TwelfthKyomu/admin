import { LABEL_MAX, NAME_MAX, PHONE_MAX } from '@/shared/constants/default';
import { idSchema } from '@/shared/validation/base';
import * as z from 'zod/mini';

export const ClientsActionInputSchema = z.object({
    projectId: idSchema,
    search: z.optional(z.string().check(z.trim(), z.maxLength(LABEL_MAX))),
});

const ClientEmailSchema = z.pipe(
    z.string().check(z.trim(), z.toLowerCase(), z.maxLength(LABEL_MAX)),
    z.union([z.literal(''), z.email('Некорректный email')]),
);

const ClientPhoneSchema = z.string().check(z.trim(), z.maxLength(PHONE_MAX));
const OptionalNameSchema = z.string().check(z.trim(), z.maxLength(NAME_MAX));

const ClientFieldsSchema = z.object({
    firstName: z
        .string()
        .check(z.trim(), z.minLength(1, 'Укажите имя'), z.maxLength(NAME_MAX)),
    lastName: z.optional(OptionalNameSchema),
    middleName: z.optional(OptionalNameSchema),
    email: z.optional(ClientEmailSchema),
    phone: z.optional(ClientPhoneSchema),
});

const CONTACT_REQUIRED = {
    error: 'Укажите email или телефон',
    path: ['phone'],
};

function hasContact(data: { email?: string; phone?: string }): boolean {
    return Boolean(data.email || data.phone);
}

export const CreateClientActionInputSchema = z
    .extend(ClientFieldsSchema, { projectId: idSchema })
    .check(z.refine(hasContact, CONTACT_REQUIRED));

export const UpdateClientActionInputSchema = z
    .extend(ClientFieldsSchema, { id: idSchema, projectId: idSchema })
    .check(z.refine(hasContact, CONTACT_REQUIRED));
