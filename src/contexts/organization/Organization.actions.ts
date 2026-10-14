'use server';

import { db } from '@/infrastructure/database/client';
import { authActionClient } from '@/shared/api/action-client';
import { ApplicationError } from '@/shared/api/errors';
import { insertOne } from '@/shared/api/repository';
import { OrganizationRole } from '@/contexts/organizationMember/OrganizationMember.types';
import { organizationMembers } from '@/contexts/organizationMember/OrganizationMembers.table';
import { eq } from 'drizzle-orm';
import { CreateOrganizationActionInputSchema } from './Organization.schema';
import { organizations } from './Organizations.table';

export const createOrganizationAction = authActionClient
    .inputSchema(CreateOrganizationActionInputSchema)
    .action(async ({ parsedInput, ctx: { userId } }) => {
        const [membership] = await db
            .select({ leftAt: organizationMembers.leftAt })
            .from(organizationMembers)
            .where(eq(organizationMembers.userId, userId))
            .limit(1);

        if (membership) {
            throw new ApplicationError(
                membership.leftAt
                    ? 'Вас исключили из организации. Вернуться можно по новому приглашению от неё.'
                    : 'Пользователь может принадлежать только к одной организации',
            );
        }

        return db.transaction(async (tx) => {
            const organization = await insertOne(
                organizations,
                {
                    name: parsedInput.name,
                    createdBy: userId,
                },
                'Не удалось создать организацию',
                tx,
            );

            await tx.insert(organizationMembers).values({
                userId,
                organizationId: organization.id,
                role: OrganizationRole.OWNER,
            });

            return organization;
        });
    });
