import 'server-only';

import { db } from '@/infrastructure/database/client';
import { organizationMembers } from '@/contexts/organizationMember/OrganizationMembers.table';
import { and, eq, isNull } from 'drizzle-orm';
import {
    organizations,
    type UserOrganizationView,
} from './Organizations.table';

export async function findOrganizationByUserId(
    userId: string,
): Promise<UserOrganizationView | null> {
    const [row] = await db
        .select({ organization: organizations, role: organizationMembers.role })
        .from(organizationMembers)
        .innerJoin(
            organizations,
            eq(organizations.id, organizationMembers.organizationId),
        )
        .where(
            and(
                eq(organizationMembers.userId, userId),
                isNull(organizationMembers.leftAt),
            ),
        )
        .limit(1);

    return row ? { ...row.organization, role: row.role } : null;
}
