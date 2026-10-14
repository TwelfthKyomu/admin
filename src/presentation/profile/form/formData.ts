import { nameSchema, passwordSchema } from '@/shared/validation/schemas';
import * as z from 'zod/mini';

export const AccountFormSchema = z.object({
    name: nameSchema,
});

export type AccountFormValues = z.input<typeof AccountFormSchema>;

export const PasswordFormSchema = z
    .object({
        currentPassword: z
            .string()
            .check(z.minLength(1, 'Введите текущий пароль')),
        newPassword: passwordSchema,
        confirmPassword: z.string().check(z.minLength(1, 'Повторите пароль')),
        revokeOtherSessions: z.boolean(),
    })
    .check(
        z.refine((data) => data.newPassword === data.confirmPassword, {
            error: 'Пароли не совпадают',
            path: ['confirmPassword'],
        }),
    );

export type PasswordFormValues = z.input<typeof PasswordFormSchema>;

export const PASSWORD_DEFAULT: PasswordFormValues = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    revokeOtherSessions: true,
};
