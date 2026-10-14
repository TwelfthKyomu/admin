import type { PropsWithChildren } from 'react';
import { ErrorBoundary } from '@/shared/components/feedback/ErrorBoundary';
import type { Locale } from '@/i18n/config';
import { type AbstractIntlMessages, NextIntlClientProvider } from 'next-intl';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { QueryProvider } from './QueryProvider';

type ProvidersProps = PropsWithChildren<{
    locale: Locale;
    messages: AbstractIntlMessages;
    timeZone: string;
}>;

export const Providers = ({ children, locale, messages, timeZone }: ProvidersProps) => (
    <NextIntlClientProvider
        messages={messages}
        locale={locale}
        timeZone={timeZone}
    >
        <NuqsAdapter>
            <QueryProvider>
                <ErrorBoundary>{children}</ErrorBoundary>
            </QueryProvider>
        </NuqsAdapter>
    </NextIntlClientProvider>
);
