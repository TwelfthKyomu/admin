import { defaultLocale, type Locale, locales } from './config';

export function isValidLocale(locale: string): locale is Locale {
    return locales.includes(locale as Locale);
}

export function getValidLocale(locale: string | null | undefined): Locale {
    if (!locale) return defaultLocale;

    return isValidLocale(locale) ? locale : defaultLocale;
}

export function getLocaleDisplayName(locale: Locale): string {
    const displayNames: Record<Locale, string> = {
        en: 'English',
        ru: 'Русский',
    };

    return displayNames[locale];
}

export function getLocaleFlag(locale: Locale): string {
    const flags: Record<Locale, string> = {
        en: '🇬🇧',
        ru: '🇷🇺',
    };

    return flags[locale];
}

export function formatDate(date: Date, locale: Locale): string {
    return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(date);
}

export function formatNumber(num: number, locale: Locale): string {
    return new Intl.NumberFormat(locale).format(num);
}

export function formatCurrency(
    amount: number,
    locale: Locale,
    currency: string = 'RUB',
): string {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
    }).format(amount);
}
