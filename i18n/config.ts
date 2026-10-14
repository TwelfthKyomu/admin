export const locales = ['en', 'ru'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'ru';

export const localeMetadata = {
    en: {
        name: 'English',
        flag: '🇬🇧',
        direction: 'ltr' as const,
    },
    ru: {
        name: 'Русский',
        flag: '🇷🇺',
        direction: 'ltr' as const,
    },
} satisfies Record<
    Locale,
    { name: string; flag: string; direction: 'ltr' | 'rtl' }
>;
