import { cookies, headers } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';
import { defaultLocale, type Locale, locales } from './config';

function toLocale(value?: string | null): Locale | undefined {
    return locales.find((locale) => locale === value);
}

export default getRequestConfig(async () => {
    const cookieStore = await cookies();
    const headersList = await headers();

    const validLocale =
        toLocale(cookieStore.get('NEXT_LOCALE')?.value) ??
        toLocale(headersList.get('x-locale')) ??
        defaultLocale;

    const messages = {
        ...(await import(`../public/locales/${validLocale}/common.json`))
            .default,
        ...(await import(`../public/locales/${validLocale}/auth.json`)).default,
        ...(await import(`../public/locales/${validLocale}/errors.json`))
            .default,
        ...(await import(`../public/locales/${validLocale}/validation.json`))
            .default,
        ...(await import(`../public/locales/${validLocale}/action.json`))
            .default,
        ...(await import(`../public/locales/${validLocale}/forms.json`))
            .default,
    };

    return {
        locale: validLocale,
        messages,
        timeZone: 'Europe/Moscow',
        defaultTranslationValues: {
            important: (chunks: React.ReactNode) => `<b>${chunks}</b>`,
        },
        formats: {
            dateTime: {
                short: {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                },
            },
        },
    };
});
