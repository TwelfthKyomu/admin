import { createElement } from 'react';
import { db } from '@/infrastructure/database/client';
import * as schema from '@/infrastructure/database/schemas';
import { sendEmail } from '@/infrastructure/email/sendEmail';
import {
    ActionEmail,
    type ActionEmailProps,
} from '@/infrastructure/email/templates/ActionEmail';
import { env } from '@/env';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { localization } from 'better-auth-localization';

const BRAND = 'Flowsy';

const trustedProxies = (env.TRUSTED_PROXY_IPS ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

function greeting(name: string | null | undefined): string {
    return name ? `Здравствуйте, ${name}!` : 'Здравствуйте!';
}

function sendInBackground(
    to: string,
    subject: string,
    props: ActionEmailProps,
): void {
    sendEmail({
        to,
        subject: `${subject} — ${BRAND}`,
        react: createElement(ActionEmail, props),
        text: [...props.lines, props.action.url, props.footer].join('\n\n'),
    }).catch((error: unknown) => {
        console.error(`[email] «${subject}» для ${to} не отправлено:`, error);
    });
}

export const auth = betterAuth({
    secret: env.AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL ?? env.NEXT_PUBLIC_APP_URL,
    trustedOrigins: [
        ...(env.NODE_ENV === 'development' ? ['http://localhost:3001'] : []),
    ],
    database: drizzleAdapter(db, {
        provider: 'pg',
        schema,
        usePlural: true,
    }),
    emailAndPassword: {
        enabled: true,
        autoSignIn: true,
        requireEmailVerification: false,
        minPasswordLength: 8,
        maxPasswordLength: 128,
        resetPasswordTokenExpiresIn: 60 * 60,
        revokeSessionsOnPasswordReset: true,
        sendResetPassword: async ({ user, url }) => {
            sendInBackground(user.email, 'Сброс пароля', {
                brand: BRAND,
                heading: 'Сброс пароля',
                lines: [
                    greeting(user.name),
                    'Вы запросили сброс пароля. Ссылка действует 1 час.',
                ],
                action: { label: 'Задать новый пароль', url },
                footer: 'Если вы не запрашивали сброс — просто проигнорируйте это письмо.',
            });
        },
    },
    emailVerification: {
        sendOnSignUp: true,
        autoSignInAfterVerification: true,
        sendVerificationEmail: async ({ user, url }) => {
            sendInBackground(user.email, 'Подтверждение почты', {
                brand: BRAND,
                heading: 'Подтвердите почту',
                lines: [
                    greeting(user.name),
                    'Подтвердите адрес почты, чтобы завершить регистрацию.',
                ],
                action: { label: 'Подтвердить почту', url },
                footer: `Если вы не регистрировались в ${BRAND} — просто проигнорируйте это письмо.`,
            });
        },
    },
    socialProviders: {
        ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
            ? {
                  google: {
                      clientId: env.GOOGLE_CLIENT_ID,
                      clientSecret: env.GOOGLE_CLIENT_SECRET,
                  },
              }
            : {}),
        ...(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
            ? {
                  github: {
                      clientId: env.GITHUB_CLIENT_ID,
                      clientSecret: env.GITHUB_CLIENT_SECRET,
                  },
              }
            : {}),
    },
    session: {
        cookieCache: {
            enabled: true,
            maxAge: 10 * 60,
        },
        expiresIn: 60 * 60 * 24 * 7,
        updateAge: 60 * 60 * 24,
    },
    plugins: [localization({ defaultLocale: 'ru-RU' })],
    rateLimit: {
        enabled: env.NODE_ENV === 'production',
        window: 60,
        max: 120,
        customRules: {
            '/sign-in/*': { window: 60, max: 30 },
            '/sign-up/*': { window: 60, max: 15 },
            '/request-password-reset': { window: 60, max: 5 },
            '/reset-password': { window: 60, max: 10 },
        },
    },
    advanced: {
        ...(trustedProxies.length > 0 ? { ipAddress: { trustedProxies } } : {}),
        defaultCookieAttributes: {
            httpOnly: true,
            sameSite: 'lax',
            secure: (env.BETTER_AUTH_URL ?? env.NEXT_PUBLIC_APP_URL).startsWith(
                'https://',
            ),
        },
    },
});
