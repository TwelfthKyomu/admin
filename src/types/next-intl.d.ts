import type { Locale } from '@/i18n/config';

type Messages = typeof import('../../public/locales/ru/common.json') &
    typeof import('../../public/locales/ru/auth.json') &
    typeof import('../../public/locales/ru/errors.json') &
    typeof import('../../public/locales/ru/validation.json') &
    typeof import('../../public/locales/ru/action.json') &
    typeof import('../../public/locales/ru/forms.json');

declare global {
    interface IntlMessages extends Messages {}
}

declare module 'next-intl' {
    interface AppConfig {
        Locale: Locale;
    }
}
