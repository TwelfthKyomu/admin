import 'server-only';

import { db } from '@/infrastructure/database/client';
import { ApplicationError } from '@/shared/api/errors';
import { createHash } from 'node:crypto';
import {
    generateRandomString,
    hashPassword,
    verifyPassword,
} from 'better-auth/crypto';
import { addMinutes } from 'date-fns';
import { and, eq, isNotNull } from 'drizzle-orm';
import { type ClientRecord, clients } from './Clients.table';

export const VERIFICATION_CODE_MINUTES = 15;

function hashCode(code: string): string {
    return createHash('sha256').update(code).digest('hex');
}

function issueCode() {
    const code = generateRandomString(6, '0-9');

    return {
        code,
        fields: {
            verificationCodeHash: hashCode(code),
            verificationCodeExpiresAt: addMinutes(
                new Date(),
                VERIFICATION_CODE_MINUTES,
            ),
        },
    };
}

function isValidCode(client: ClientRecord | undefined, code: string): boolean {
    return Boolean(
        client?.verificationCodeHash &&
            client.verificationCodeExpiresAt &&
            client.verificationCodeExpiresAt >= new Date() &&
            client.verificationCodeHash === hashCode(code),
    );
}

async function findClientByEmail(
    projectId: string,
    email: string,
): Promise<ClientRecord | undefined> {
    const [client] = await db
        .select()
        .from(clients)
        .where(and(eq(clients.projectId, projectId), eq(clients.email, email)))
        .limit(1);

    return client;
}

export async function startClientRegistration(
    projectId: string,
    input: {
        firstName: string;
        lastName?: string;
        email: string;
        password: string;
    },
): Promise<string> {
    const existing = await findClientByEmail(projectId, input.email);

    if (existing?.emailVerifiedAt) {
        throw new ApplicationError('Аккаунт с этой почтой уже есть — войдите');
    }

    const { code, fields } = issueCode();

    const credentials = {
        passwordHash: await hashPassword(input.password),
        ...fields,
    };

    if (existing) {
        await db
            .update(clients)
            .set(credentials)
            .where(eq(clients.id, existing.id));
    } else {
        await db.insert(clients).values({
            projectId,
            email: input.email,
            firstName: input.firstName,
            lastName: input.lastName || null,
            ...credentials,
        });
    }

    return code;
}

export async function confirmClientEmail(
    projectId: string,
    email: string,
    code: string,
): Promise<ClientRecord> {
    const client = await findClientByEmail(projectId, email);

    if (!client || !isValidCode(client, code)) {
        throw new ApplicationError('Неверный или просроченный код');
    }

    const [verified] = await db
        .update(clients)
        .set({
            emailVerifiedAt: new Date(),
            verificationCodeHash: null,
            verificationCodeExpiresAt: null,
        })
        .where(eq(clients.id, client.id))
        .returning();

    return verified ?? client;
}

export async function findClientByPassword(
    projectId: string,
    email: string,
    password: string,
): Promise<ClientRecord> {
    const client = await findClientByEmail(projectId, email);

    const valid =
        client?.emailVerifiedAt && client.passwordHash
            ? await verifyPassword({ hash: client.passwordHash, password })
            : false;

    if (!client || !valid) {
        throw new ApplicationError('Неверная почта или пароль');
    }

    return client;
}

export async function findVerifiedClient(
    projectId: string,
    clientId: string,
): Promise<ClientRecord | undefined> {
    const [client] = await db
        .select()
        .from(clients)
        .where(
            and(
                eq(clients.id, clientId),
                eq(clients.projectId, projectId),
                isNotNull(clients.emailVerifiedAt),
            ),
        )
        .limit(1);

    return client;
}

export async function startPasswordReset(
    projectId: string,
    email: string,
): Promise<string | undefined> {
    const client = await findClientByEmail(projectId, email);

    if (!client?.emailVerifiedAt) return undefined;

    const { code, fields } = issueCode();

    await db.update(clients).set(fields).where(eq(clients.id, client.id));

    return code;
}

export async function resetClientPassword(
    projectId: string,
    input: { email: string; code: string; password: string },
): Promise<ClientRecord> {
    const client = await findClientByEmail(projectId, input.email);

    if (!client?.emailVerifiedAt || !isValidCode(client, input.code)) {
        throw new ApplicationError('Неверный или просроченный код');
    }

    const [updated] = await db
        .update(clients)
        .set({
            passwordHash: await hashPassword(input.password),
            verificationCodeHash: null,
            verificationCodeExpiresAt: null,
        })
        .where(eq(clients.id, client.id))
        .returning();

    return updated ?? client;
}
