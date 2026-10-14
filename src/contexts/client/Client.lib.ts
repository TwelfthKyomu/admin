import 'server-only';

import type { Tx } from '@/infrastructure/database/client';
import { findInProject, insertOne } from '@/shared/api/repository';
import { and, eq } from 'drizzle-orm';
import { type ClientRecord, type ClientView, clients } from './Clients.table';

export function findClientInProject(
    id: string,
    projectId: string,
): Promise<ClientRecord> {
    return findInProject(clients, id, projectId, 'Клиент не найден');
}

export function toClientView({
    passwordHash: _passwordHash,
    verificationCodeHash: _verificationCodeHash,
    verificationCodeExpiresAt: _verificationCodeExpiresAt,
    ...client
}: ClientRecord): ClientView {
    return client;
}

function clientNameParts(name: string) {
    const [firstName = name, ...rest] = name.trim().split(/\s+/);

    return { firstName, lastName: rest.join(' ') || null };
}

export async function addClientSpending(
    tx: Tx,
    clientId: string,
    change: { orders: number; amount: number; visitedAt?: Date },
): Promise<void> {
    const [client] = await tx
        .select({
            totalOrders: clients.totalOrders,
            totalSpentAmount: clients.totalSpentAmount,
        })
        .from(clients)
        .where(eq(clients.id, clientId))
        .limit(1)
        .for('update');

    if (!client) return;

    await tx
        .update(clients)
        .set({
            totalOrders: client.totalOrders + change.orders,
            totalSpentAmount: Math.max(
                client.totalSpentAmount + change.amount,
                0,
            ),
            lastVisitAt: change.visitedAt,
        })
        .where(eq(clients.id, clientId));
}

export async function findOrCreateClient(
    tx: Tx,
    projectId: string,
    customer: { name: string; email?: string; phone?: string },
): Promise<string> {
    const [existing] = await tx
        .select({ id: clients.id, phone: clients.phone })
        .from(clients)
        .where(
            and(
                eq(clients.projectId, projectId),
                customer.email
                    ? eq(clients.email, customer.email)
                    : eq(clients.phone, customer.phone ?? ''),
            ),
        )
        .limit(1);

    if (existing) {
        if (!existing.phone && customer.phone) {
            await tx
                .update(clients)
                .set({ phone: customer.phone })
                .where(eq(clients.id, existing.id));
        }

        return existing.id;
    }

    const created = await insertOne(
        clients,
        {
            projectId,
            ...clientNameParts(customer.name),
            email: customer.email ?? null,
            phone: customer.phone ?? null,
        },
        'Не удалось сохранить покупателя',
        tx,
    );

    return created.id;
}
