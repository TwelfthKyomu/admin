'use server';

import { db, type Tx } from '@/infrastructure/database/client';
import {
    authActionClient,
    projectMutationAction,
    projectReadAction,
} from '@/shared/api/action-client';
import { ApplicationError } from '@/shared/api/errors';
import { findInProject, insertOne } from '@/shared/api/repository';
import { enforceRateLimit } from '@/shared/security/rate-limit';
import { recordAudit } from '@/contexts/auditLog/AuditLog.lib';
import {
    AuditAction,
    AuditTargetType,
} from '@/contexts/auditLog/AuditLog.types';
import { ensureEmployeeAssigned } from '@/contexts/employeeAssignment/EmployeeAssignment.lib';
import { OrganizationRole } from '@/contexts/organizationMember/OrganizationMember.types';
import { organizationMembers } from '@/contexts/organizationMember/OrganizationMembers.table';
import { projects } from '@/contexts/project/Projects.table';
import { projectMembers } from '@/contexts/projectMember/ProjectMembers.table';
import { Permission } from '@/contexts/user/User.types';
import { generateRandomString } from 'better-auth/crypto';
import { addDays } from 'date-fns';
import { and, desc, eq, isNull } from 'drizzle-orm';
import {
    AcceptProjectInviteActionInputSchema,
    CreateProjectInviteActionInputSchema,
    ProjectInvitesActionInputSchema,
    RevokeProjectInviteActionInputSchema,
} from './ProjectInvite.schema';
import {
    INVITE_TTL_DAYS,
    inviteStatusAt,
    ProjectInviteStatus,
} from './ProjectInvite.types';
import { projectInvites } from './ProjectInvites.table';

function validateInvite(
    invite: typeof projectInvites.$inferSelect,
    code: string,
    email: string | null | undefined,
) {
    const status = inviteStatusAt(invite);

    if (status !== ProjectInviteStatus.PENDING) {
        throw new ApplicationError(`Приглашение недоступно (${status})`);
    }
    if (code !== invite.verificationCode) {
        throw new ApplicationError('Неверный код подтверждения');
    }
    if (
        invite.email &&
        (!email || invite.email !== email.trim().toLowerCase())
    ) {
        throw new ApplicationError('Это приглашение оформлено на другой email');
    }
}

async function ensureOrganizationMember(
    tx: Tx,
    userId: string,
    organizationId: string,
) {
    const [member] = await tx
        .select()
        .from(organizationMembers)
        .where(eq(organizationMembers.userId, userId))
        .limit(1);

    if (!member) {
        await tx.insert(organizationMembers).values({
            userId,
            organizationId,
            role: OrganizationRole.MEMBER,
        });

        return;
    }
    if (member.organizationId !== organizationId) {
        throw new ApplicationError(
            'Вы уже состоите в другой организации — выход не поддерживается',
        );
    }

    await tx
        .update(organizationMembers)
        .set({ leftAt: null, role: OrganizationRole.MEMBER })
        .where(eq(organizationMembers.id, member.id));
}

export const projectInvitesAction = projectReadAction(Permission.MANAGE_MEMBERS)
    .inputSchema(ProjectInvitesActionInputSchema)
    .action(({ parsedInput: { projectId } }) =>
        db
            .select()
            .from(projectInvites)
            .where(eq(projectInvites.projectId, projectId))
            .orderBy(desc(projectInvites.createdAt)),
    );

export const createProjectInviteAction = projectMutationAction(
    Permission.MANAGE_MEMBERS,
    'invite:create',
)
    .inputSchema(CreateProjectInviteActionInputSchema)
    .action(async ({ parsedInput, ctx: { userId, organizationId } }) => {
        const invite = await insertOne(
            projectInvites,
            {
                projectId: parsedInput.projectId,
                email: parsedInput.email?.trim().toLowerCase() || null,
                verificationCode: generateRandomString(6, '0-9'),
                expiresAt: addDays(new Date(), INVITE_TTL_DAYS),
                createdBy: userId,
            },
            'Не удалось создать приглашение',
        );

        await recordAudit({
            organizationId,
            projectId: parsedInput.projectId,
            actorUserId: userId,
            action: AuditAction.InviteCreated,
            targetType: AuditTargetType.ProjectInvite,
            targetId: invite.id,
            summary: invite.email
                ? `Создано приглашение для ${invite.email}`
                : 'Создано приглашение по ссылке',
        });

        return invite;
    });

export const revokeProjectInviteAction = projectMutationAction(
    Permission.MANAGE_MEMBERS,
)
    .inputSchema(RevokeProjectInviteActionInputSchema)
    .action(async ({ parsedInput: { id, projectId } }) => {
        const invite = await findInProject(
            projectInvites,
            id,
            projectId,
            'Приглашение не найдено',
        );

        if (inviteStatusAt(invite) !== ProjectInviteStatus.PENDING) {
            throw new ApplicationError(
                'Отозвать можно только активное приглашение',
            );
        }

        await db
            .update(projectInvites)
            .set({ revokedAt: new Date() })
            .where(eq(projectInvites.id, id));

        return { id };
    });

export const acceptProjectInviteAction = authActionClient
    .inputSchema(AcceptProjectInviteActionInputSchema)
    .action(async ({ parsedInput: { token, code }, ctx: { userId, user } }) => {
        enforceRateLimit('invite:accept', userId);

        const accepted = await db.transaction(async (tx) => {
            const [invite] = await tx
                .select()
                .from(projectInvites)
                .where(eq(projectInvites.token, token))
                .limit(1)
                .for('update');

            if (!invite) throw new ApplicationError('Приглашение не найдено');

            const [project] = await tx
                .select({ organizationId: projects.organizationId })
                .from(projects)
                .where(
                    and(
                        eq(projects.id, invite.projectId),
                        isNull(projects.deletedAt),
                    ),
                )
                .limit(1);

            if (!project)
                throw new ApplicationError('Проект больше недоступен');

            validateInvite(invite, code, user.email);
            await ensureOrganizationMember(tx, userId, project.organizationId);

            await tx
                .insert(projectMembers)
                .values({
                    userId,
                    projectId: invite.projectId,
                })
                .onConflictDoUpdate({
                    target: [projectMembers.userId, projectMembers.projectId],
                    set: { leftAt: null },
                });

            await tx
                .update(projectInvites)
                .set({ acceptedAt: new Date(), acceptedBy: userId })
                .where(eq(projectInvites.id, invite.id));

            return {
                inviteId: invite.id,
                projectId: invite.projectId,
                organizationId: project.organizationId,
            };
        });

        await ensureEmployeeAssigned({
            organizationId: accepted.organizationId,
            projectId: accepted.projectId,
            userId,
        });

        await recordAudit({
            organizationId: accepted.organizationId,
            projectId: accepted.projectId,
            actorUserId: userId,
            action: AuditAction.ProjectMemberAttached,
            targetType: AuditTargetType.ProjectInvite,
            targetId: accepted.inviteId,
            summary: `${user.name} присоединился к проекту по приглашению`,
        });

        return { projectId: accepted.projectId };
    });
