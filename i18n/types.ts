import type en from '@public/locales/en/common.json';
import type ru from '@public/locales/ru/common.json';

export type TranslationKeys = keyof typeof en | keyof typeof ru;

export type CommonKeys = keyof typeof en;
export type AuthKeys = keyof typeof en;
export type ErrorKeys = keyof typeof en;
export type ValidationKeys = keyof typeof en;
export type ActionKeys = keyof typeof en;
export type FormKeys = keyof typeof en;

export type TranslationNamespace =
    | 'common'
    | 'auth'
    | 'errors'
    | 'validation'
    | 'action'
    | 'forms';

export type TranslateFn = (
    key: string,
    values?: Record<string, unknown>,
) => string;
