import { URL_MAX } from '@/shared/constants/default';
import * as z from 'zod/mini';

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const UPPER_CODE_PATTERN = /^[A-Z0-9-]+$/;

export const LOWER_CODE_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

const UPPER_LETTERS_PATTERN = /^[A-Z]+$/;

const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

const HEX_COLOR_ALPHA_PATTERN = /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

export function textField(max: number, min = 1) {
    return z.string().check(z.minLength(min), z.maxLength(max));
}

export function slugField(max: number) {
    return z
        .string()
        .check(z.minLength(1), z.maxLength(max), z.regex(SLUG_PATTERN));
}

export function upperCodeField(max: number, min = 1) {
    return z
        .string()
        .check(z.minLength(min), z.maxLength(max), z.regex(UPPER_CODE_PATTERN));
}

export function lowerCodeField(max: number) {
    return z
        .string()
        .check(z.minLength(1), z.maxLength(max), z.regex(LOWER_CODE_PATTERN));
}

export function upperKeyField(min: number, max: number) {
    return z
        .string()
        .check(
            z.minLength(min),
            z.maxLength(max),
            z.regex(UPPER_LETTERS_PATTERN),
        );
}

export const hexColorField = z.string().check(z.regex(HEX_COLOR_PATTERN));

export const hexColorAlphaField = z
    .string()
    .check(z.regex(HEX_COLOR_ALPHA_PATTERN));

export function normalizeCode(value: string, max: number): string | null {
    const code = value
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

    if (!code || code.length > max) return null;

    return LOWER_CODE_PATTERN.test(code) ? code : null;
}

export const imageUrlField = z.string().check(
    z.maxLength(URL_MAX),
    z.refine(
        (value) => /^https?:\/\//.test(value) || value.startsWith('/files/'),
        'Нужна ссылка http(s) или загруженный файл',
    ),
);
