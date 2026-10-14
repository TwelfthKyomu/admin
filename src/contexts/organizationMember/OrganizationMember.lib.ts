import 'server-only';

import { db, type Tx } from '@/infrastructure/database/client';
import { users } from '@/contexts/user/Users.table';
import { and, asc, eq, inArray, isNull } from 'drizzle-orm';
import { organizationMembers } from './OrganizationMembers.table';

export async function findMemberIdByUserId(
    organizationId: string,
    userId: string,
): Promise<string | null> {
    const [member] = await db
        .select({ id: organizationMembers.id })
        .from(organizationMembers)
        .where(
            and(
                eq(organizationMembers.organizationId, organizationId),
                eq(organizationMembers.userId, userId),
                isNull(organizationMembers.leftAt),
            ),
        )
        .limit(1);

    return member?.id ?? null;
}

export async function memberNamesByIds(
    ids: string[],
): Promise<Map<string, string>> {
    if (ids.length === 0) return new Map();

    const rows = await db
        .select({ id: organizationMembers.id, name: users.name })
        .from(organizationMembers)
        .innerJoin(users, eq(users.id, organizationMembers.userId))
        .where(inArray(organizationMembers.id, [...new Set(ids)]));

    return new Map(rows.map((row) => [row.id, row.name]));
}

export async function lockEmployees(
    tx: Tx,
    employeeIds: string[],
): Promise<void> {
    await tx
        .select({ id: organizationMembers.id })
        .from(organizationMembers)
        .where(inArray(organizationMembers.id, employeeIds))
        .orderBy(asc(organizationMembers.id))
        .for('no key update');
}
