import { NAME_MAX, NAME_MIN } from '@/shared/constants/default';
import * as z from 'zod/mini';

export const emailSchema = z.pipe(
    z
        .string()
        .check(z.minLength(1, 'Email обязателен'), z.trim(), z.toLowerCase()),
    z.email('Некорректный email адрес'),
);

export const passwordSchema = z
    .string()
    .check(
        z.minLength(8, 'Пароль должен содержать минимум 8 символов'),
        z.maxLength(100, 'Пароль слишком длинный'),
        z.regex(
            /[A-Z]/,
            'Пароль должен содержать хотя бы одну заглавную букву',
        ),
        z.regex(/[a-z]/, 'Пароль должен содержать хотя бы одну строчную букву'),
        z.regex(/[0-9]/, 'Пароль должен содержать хотя бы одну цифру'),
    );

export const nameSchema = z
    .string()
    .check(
        z.minLength(NAME_MIN, 'Имя должно содержать минимум 2 символа'),
        z.maxLength(NAME_MAX, 'Имя слишком длинное'),
        z.trim(),
    );

export const phoneSchema = z.optional(
    z
        .string()
        .check(z.regex(/^\+?[1-9]\d{1,14}$/, 'Некорректный номер телефона')),
);
