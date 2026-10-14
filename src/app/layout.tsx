import { type PropsWithChildren, Suspense } from 'react';
import { IntlProviders } from '@/app/providers/IntlProviders';
import { PageLoader } from '@/shared/components/common';
import { Toaster } from '@/shared/components/ui/Base/Sonner';
import { defaultLocale } from '@/i18n/config';
import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import '@/app/index.css';

const inter = Inter({
    subsets: ['latin', 'cyrillic'],
    variable: '--font-sans',
    display: 'swap',
});

const mono = JetBrains_Mono({
    subsets: ['latin'],
    variable: '--font-mono',
    display: 'swap',
});

export const metadata: Metadata = {
    title: {
        default: 'Flowsy',
        template: '%s | Flowsy',
    },
    description: 'Заказы, записи, смены, касса и зарплата в одной админке',
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    metadataBase: new URL(
        process.env.NEXT_PUBLIC_API_URL ||
            process.env.NEXT_PUBLIC_APP_URL ||
            'http://localhost:3000',
    ),
    openGraph: {
        title: 'Flowsy',
        description: 'Заказы, записи, смены, касса и зарплата в одной админке',
        type: 'website',
        locale: 'ru_RU',
        siteName: 'Flowsy',
    },
    robots: {
        index: process.env.NODE_ENV === 'production',
        follow: process.env.NODE_ENV === 'production',
        googleBot: {
            index: process.env.NODE_ENV === 'production',
            follow: process.env.NODE_ENV === 'production',
        },
    },
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    themeColor: [
        {
            media: '(prefers-color-scheme: light)',
            color: '#ffffff',
        },
        {
            media: '(prefers-color-scheme: dark)',
            color: '#0a0a0a',
        },
    ],
};

const RootLayout = ({ children }: PropsWithChildren) => (
    <html
        lang={defaultLocale}
        suppressHydrationWarning
        className={`${inter.variable} ${mono.variable}`}
    >
        <body className="dark dark-theme">
            <Suspense fallback={<PageLoader />}>
                <IntlProviders>
                    {children}
                    <Toaster />
                </IntlProviders>
            </Suspense>
        </body>
    </html>
);

export default RootLayout;
