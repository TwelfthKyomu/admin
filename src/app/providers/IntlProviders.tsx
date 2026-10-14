import type { PropsWithChildren } from 'react';
import { defaultLocale, type Locale, locales } from '@/i18n/config';
import { getLocale, getMessages } from 'next-intl/server';
import { LangSync } from './LangSync';
import { Providers } from './Providers';

export const IntlProviders = async ({ children }: PropsWithChildren) => {
    const rawLocale = await getLocale();
    const locale: Locale = locales.find((candidate) => candidate === rawLocale) ?? defaultLocale;
    const messages = await getMessages();

    return (
        <Providers
            locale={locale}
            messages={messages}
            timeZone="Europe/Moscow"
        >
            <LangSync locale={locale} />
            {children}
        </Providers>
    );
};
