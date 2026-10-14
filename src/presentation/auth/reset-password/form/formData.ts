import { passwordSchema } from '@/shared/validation/schemas';
import * as z from 'zod/mini';

export const ResetPasswordFormSchema = z
    .object({
        password: passwordSchema,
        confirmPassword: z.string().check(z.minLength(1, 'Повторите пароль')),
    })
    .check(
        z.refine((data) => data.password === data.confirmPassword, {
            error: 'Пароли не совпадают',
            path: ['confirmPassword'],
        }),
    );

export type ResetPasswordFormValues = z.input<typeof ResetPasswordFormSchema>;

export const RESET_PASSWORD_DEFAULT: ResetPasswordFormValues = {
    password: '',
    confirmPassword: '',
};
