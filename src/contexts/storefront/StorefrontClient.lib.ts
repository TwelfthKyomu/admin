import 'server-only';

import { sendEmail } from '@/infrastructure/email/sendEmail';
import { ApplicationError } from '@/shared/api/errors';
import { enforceRateLimit } from '@/shared/security/rate-limit';
import {
    confirmClientEmail,
    findClientByPassword,
    findVerifiedClient,
    resetClientPassword,
    startClientRegistration,
    startPasswordReset,
    VERIFICATION_CODE_MINUTES,
} from '@/contexts/client/ClientAccount.lib';
import type { ClientRecord } from '@/contexts/client/Clients.table';
import { env } from '@/env';
import { signJWT, verifyJWT } from 'better-auth/crypto';
import { addDays } from 'date-fns';
import { secondsInDay } from 'date-fns/constants';
import { StorefrontAuthError } from './Storefront.lib';
import type {
    StorefrontLoginInput,
    StorefrontPasswordForgotInput,
    StorefrontPasswordResetInput,
    StorefrontRegisterInput,
    StorefrontVerifyInput,
} from './Storefront.schema';
import type { StorefrontAccess } from './Storefront.types';
import { loadClientOrders } from './StorefrontOrder.lib';

const SESSION_DAYS = 30;

function toStorefrontClient(client: ClientRecord) {
    return {
        id: client.id,
        firstName: client.firstName,
        lastName: client.lastName ?? undefined,
        email: client.email ?? '',
        phone: client.phone ?? undefined,
    };
}

async function clientSession(client: ClientRecord) {
    return {
        client: toStorefrontClient(client),
        token: await signJWT(
            { clientId: client.id },
            env.AUTH_SECRET,
            SESSION_DAYS * secondsInDay,
        ),
        expiresAt: addDays(new Date(), SESSION_DAYS),
    };
}

async function readClientSession(token: string): Promise<string> {
    const session = await verifyJWT<{ clientId?: string }>(
        token,
        env.AUTH_SECRET,
    );

    if (!session?.clientId) throw new StorefrontAuthError('Войдите заново');

    return session.clientId;
}

function limitAttempts(access: StorefrontAccess, email: string): void {
    enforceRateLimit('storefront:auth', `${access.projectId}:${email}`);
}

async function sendCode(
    access: StorefrontAccess,
    email: string,
    purpose: string,
    code: string,
): Promise<void> {
    await sendEmail({
        to: email,
        subject: `${purpose} — ${access.projectName}`,
        text: `Ваш код: ${code}. Он действует ${VERIFICATION_CODE_MINUTES} минут.`,
    }).catch(() => {
        throw new ApplicationError(
            'Не удалось отправить письмо с кодом, попробуйте позже',
        );
    });
}

export async function registerStorefrontClient(
    access: StorefrontAccess,
    input: StorefrontRegisterInput,
) {
    limitAttempts(access, input.email);

    const code = await startClientRegistration(access.projectId, input);

    await sendCode(access, input.email, 'Код подтверждения', code);

    return { email: input.email };
}

export async function verifyStorefrontClient(
    access: StorefrontAccess,
    input: StorefrontVerifyInput,
) {
    limitAttempts(access, input.email);

    return clientSession(
        await confirmClientEmail(access.projectId, input.email, input.code),
    );
}

export async function loginStorefrontClient(
    access: StorefrontAccess,
    input: StorefrontLoginInput,
) {
    limitAttempts(access, input.email);

    return clientSession(
        await findClientByPassword(
            access.projectId,
            input.email,
            input.password,
        ),
    );
}

export async function requestStorefrontPasswordReset(
    access: StorefrontAccess,
    input: StorefrontPasswordForgotInput,
) {
    limitAttempts(access, input.email);

    const code = await startPasswordReset(access.projectId, input.email);

    if (code) await sendCode(access, input.email, 'Сброс пароля', code);

    return { email: input.email };
}

export async function resetStorefrontPassword(
    access: StorefrontAccess,
    input: StorefrontPasswordResetInput,
) {
    limitAttempts(access, input.email);

    return clientSession(await resetClientPassword(access.projectId, input));
}

export async function loadStorefrontClient(
    access: StorefrontAccess,
    token: string,
) {
    const client = await findVerifiedClient(
        access.projectId,
        await readClientSession(token),
    );

    if (!client) throw new StorefrontAuthError('Войдите заново');

    return {
        client: toStorefrontClient(client),
        orders: await loadClientOrders(access, client.id),
    };
}
