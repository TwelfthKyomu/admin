import 'server-only';

import type { ReactElement } from 'react';
import { env } from '@/env';
import { Resend } from 'resend';

interface EmailEnvelope {
    to: string;
    subject: string;
    fromName?: string;
}

export type SendEmailInput = EmailEnvelope &
    ({ react: ReactElement; text?: string } | { text: string; html?: string });

const UNDELIVERABLE_DOMAIN =
    /@(.+\.)?(example\.(com|net|org)|example|test|invalid|localhost)$/i;

function senderOf(from: string, name?: string): string {
    if (!name) return from;

    const address = from.match(/<([^>]+)>/)?.[1] ?? from;

    return `"${name.replaceAll('"', '')}" <${address}>`;
}

export async function sendEmail({
    to,
    subject,
    fromName,
    ...content
}: SendEmailInput): Promise<void> {
    if (UNDELIVERABLE_DOMAIN.test(to)) {
        console.warn(
            `[email] ${to} — тестовый домен, письмо «${subject}» не отправлено`,
        );

        return;
    }

    if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
        if (env.NODE_ENV === 'production') {
            throw new Error(
                'RESEND_API_KEY и EMAIL_FROM обязательны в production: без них подтверждение почты и сброс пароля не работают',
            );
        }

        console.warn(
            `[email] RESEND_API_KEY/EMAIL_FROM не заданы, письмо не отправлено.\n` +
                `To: ${to}\nSubject: ${subject}\n${content.text ?? ''}`,
        );

        return;
    }

    const { error } = await new Resend(env.RESEND_API_KEY).emails.send({
        from: senderOf(env.EMAIL_FROM, fromName),
        to: [to],
        subject,
        ...content,
    });

    if (error) {
        throw new Error(`Resend error: ${error.message}`);
    }
}
