import { db } from '@/infrastructure/database/client';
import * as schema from '@/infrastructure/database/schemas';
import { sendEmail } from '@/infrastructure/email/sendEmail';
import { env } from '@/env';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { localization } from 'better-auth-localization';

const trustedProxies = (env.TRUSTED_PROXY_IPS ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

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
        sendResetPassword: async ({ user, url }) => {
            await sendEmail({
                to: user.email,
                subject: 'Сброс пароля — Flowsy',
                text:
                    `Здравствуйте${user.name ? `, ${user.name}` : ''}!\n\n` +
                    `Вы запросили сброс пароля. Перейдите по ссылке, чтобы задать новый:\n${url}\n\n` +
                    'Ссылка действует 1 час. Если вы не запрашивали сброс — просто проигнорируйте это письмо.',
            });
        },
    },
    emailVerification: {
        sendOnSignUp: true,
        autoSignInAfterVerification: true,
        sendVerificationEmail: async ({ user, url }) => {
            const greeting = user.name ? `, ${user.name}` : '';

            await sendEmail({
                to: user.email,
                subject: 'Подтверждение почты — Flowsy',
                text:
                    `Здравствуйте${greeting}!\n\n` +
                    `Подтвердите адрес почты по ссылке:\n${url}\n\n` +
                    'Если вы не регистрировались — просто проигнорируйте это письмо.',
                html: htmlRegistration(greeting, url),
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

function htmlRegistration(greeting: string, url: string): string {
    return `
                <div style="font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #1a1a1a;">
                    <h1 style="font-size: 20px; margin: 0 0 16px;">Flowsy</h1>
                    <p style="font-size: 15px; line-height: 1.5; margin: 0 0 16px;">
                        Здравствуйте${greeting}!
                    </p>
                    <p style="font-size: 15px; line-height: 1.5; margin: 0 0 24px;">
                        Подтвердите адрес почты, чтобы завершить регистрацию:
                    </p>
                    <a href="${url}"
                       style="display: inline-block; background: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 15px; font-weight: 500;">
                        Подтвердить почту
                    </a>
                    <p style="font-size: 13px; line-height: 1.5; color: #6b7280; margin: 24px 0 0;">
                        Если ссылка не открывается, скопируйте и вставьте её в браузер:<br>
                        <span style="word-break: break-all;">${url}</span>
                    </p>
                    <p style="font-size: 13px; line-height: 1.5; color: #9ca3af; margin: 24px 0 0;">
                        Если вы не регистрировались в Flowsy — просто проигнорируйте это письмо.
                    </p>
                </div>
            `;
}
