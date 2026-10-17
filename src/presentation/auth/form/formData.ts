import { emailSchema, nameSchema, passwordSchema } from '@/shared/validation';
import * as z from 'zod/v4';

export const LoginFormSchema = z.object({
    email: emailSchema,
    password: z.string(),
    remember: z.optional(z._default(z.boolean(), false)),
});

export type LoginFormValues = z.infer<typeof LoginFormSchema>;

export const LOGIN_DEFAULT = {
    email: '',
    password: '',
    remember: false,
};

export const RegisterFormSchema = z
    .object({
        name: nameSchema,
        email: emailSchema,
        password: passwordSchema,
        confirmPassword: passwordSchema,
        agreedToTerms: z.boolean().refine((val) => val, {
            message: 'Вы должны согласиться с условиями',
        }),
    })
    .check(
        z.refine((data) => data.password === data.confirmPassword, {
            message: 'Пароли не совпадают',
            path: ['confirmPassword'],
        }),
    );

export type RegisterFormValues = z.infer<typeof RegisterFormSchema>;

export const REGISTER_DEFAULT = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreedToTerms: false,
};

export const ForgotFormSchema = z.object({ email: emailSchema });

export type ForgotFormValues = z.input<typeof ForgotFormSchema>;

export const FORGOT_DEFAULT: ForgotFormValues = { email: '' };
