'use server';

import { db } from '@/infrastructure/database/client';
import {
    projectMutationAction,
    projectReadAction,
} from '@/shared/api/action-client';
import { visibleBookingsEmployeeId } from '@/shared/api/permission';
import {
    assertUniqueInProject,
    insertOne,
    searchFilters,
    updateOne,
} from '@/shared/api/repository';
import { orders } from '@/contexts/order/Orders.table';
import {
    CLIENT_READ_PERMISSIONS,
    ORDER_PERMISSIONS,
    Permission,
} from '@/contexts/user/User.types';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { findClientInProject, toClientView } from './Client.lib';
import {
    CLIENTS_LIST_LIMIT,
    ClientsActionInputSchema,
    CreateClientActionInputSchema,
    UpdateClientActionInputSchema,
} from './Client.schema';
import { clients } from './Clients.table';

export const clientsAction = projectReadAction(CLIENT_READ_PERMISSIONS)
    .inputSchema(ClientsActionInputSchema)
    .action(
        async ({
            parsedInput: { projectId, search, limit },
            ctx: { userId },
        }) => {
            const filters = [eq(clients.projectId, projectId)];

            const ownEmployeeId = await visibleBookingsEmployeeId(
                userId,
                projectId,
            );

            if (ownEmployeeId) {
                filters.push(
                    inArray(
                        clients.id,
                        db
                            .select({ id: orders.clientId })
                            .from(orders)
                            .where(
                                and(
                                    eq(orders.projectId, projectId),
                                    eq(
                                        orders.assignedEmployeeId,
                                        ownEmployeeId,
                                    ),
                                ),
                            ),
                    ),
                );
            }

            filters.push(
                ...searchFilters(search, [
                    clients.firstName,
                    clients.lastName,
                    clients.middleName,
                    clients.email,
                    clients.phone,
                ]),
            );

            return db
                .select({
                    id: clients.id,
                    projectId: clients.projectId,
                    email: clients.email,
                    firstName: clients.firstName,
                    lastName: clients.lastName,
                    middleName: clients.middleName,
                    phone: clients.phone,
                    totalOrders: clients.totalOrders,
                    totalSpentAmount: clients.totalSpentAmount,
                    lastVisitAt: clients.lastVisitAt,
                    emailVerifiedAt: clients.emailVerifiedAt,
                    createdAt: clients.createdAt,
                })
                .from(clients)
                .where(and(...filters))
                .orderBy(desc(clients.createdAt))
                .limit(limit ?? CLIENTS_LIST_LIMIT);
        },
    );

function clientValues(input: {
    firstName: string;
    lastName?: string;
    middleName?: string;
    email?: string;
    phone?: string;
}) {
    return {
        firstName: input.firstName,
        lastName: input.lastName || null,
        middleName: input.middleName || null,
        email: input.email || null,
        phone: input.phone || null,
    };
}

async function assertEmailFree(
    projectId: string,
    email: string | null,
    excludeId?: string,
): Promise<void> {
    if (!email) return;

    await assertUniqueInProject({
        table: clients,
        column: clients.email,
        value: email,
        projectId,
        excludeId,
        conflict: `Клиент с email ${email} уже есть`,
    });
}

export const createClientAction = projectMutationAction(ORDER_PERMISSIONS)
    .inputSchema(CreateClientActionInputSchema)
    .action(async ({ parsedInput }) => {
        const values = clientValues(parsedInput);

        await assertEmailFree(parsedInput.projectId, values.email);

        return toClientView(
            await insertOne(
                clients,
                { projectId: parsedInput.projectId, ...values },
                'Не удалось создать клиента',
            ),
        );
    });

export const updateClientAction = projectMutationAction(
    Permission.MANAGE_ORDERS,
)
    .inputSchema(UpdateClientActionInputSchema)
    .action(async ({ parsedInput }) => {
        const client = await findClientInProject(
            parsedInput.id,
            parsedInput.projectId,
        );

        const values = clientValues(parsedInput);

        await assertEmailFree(client.projectId, values.email, client.id);

        return toClientView(
            await updateOne(
                clients,
                eq(clients.id, client.id),
                values,
                'Клиент не найден',
            ),
        );
    });
