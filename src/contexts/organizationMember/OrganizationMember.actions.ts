'use server';

import { db } from '@/infrastructure/database/client';
import {
    organizationMutationAction,
    organizationReadAction,
} from '@/shared/api/action-client';
import { ApplicationError } from '@/shared/api/errors';
import { updateOne } from '@/shared/api/repository';
import { recordAudit } from '@/contexts/auditLog/AuditLog.lib';
import {
    AuditAction,
    AuditTargetType,
} from '@/contexts/auditLog/AuditLog.types';
import {
    assertNoOpenWork,
    endEmployeeAssignment,
} from '@/contexts/employeeAssignment/EmployeeAssignment.lib';
import { projects } from '@/contexts/project/Projects.table';
import { projectMembers } from '@/contexts/projectMember/ProjectMembers.table';
import { Permission } from '@/contexts/user/User.types';
import { sessions, users } from '@/contexts/user/Users.table';
import { and, asc, desc, eq, inArray, isNull } from 'drizzle-orm';
import {
    ChangeOrganizationMemberRoleActionInputSchema,
    OffboardOrganizationMemberActionInputSchema,
    OrganizationMembersActionInputSchema,
} from './OrganizationMember.schema';
import {
    type OrganizationMemberView,
    OrganizationRole,
} from './OrganizationMember.types';
import {
    type OrganizationMemberRecord,
    organizationMembers,
} from './OrganizationMembers.table';

export const organizationMembersAction = organizationReadAction(
    Permission.VIEW_MEMBERS,
)
    .inputSchema(OrganizationMembersActionInputSchema)
    .action(
        async ({
            ctx: { organizationId },
        }): Promise<OrganizationMemberView[]> => {
            const members = await db
                .select({
                    id: organizationMembers.id,
                    role: organizationMembers.role,
                    joinedAt: organizationMembers.joinedAt,
                    user: {
                        id: users.id,
                        name: users.name,
                        email: users.email,
                        image: users.image,
                    },
                })
                .from(organizationMembers)
                .innerJoin(users, eq(users.id, organizationMembers.userId))
                .where(
                    and(
                        eq(organizationMembers.organizationId, organizationId),
                        isNull(organizationMembers.leftAt),
                    ),
                )
                .orderBy(desc(organizationMembers.joinedAt));

            const memberships =
                members.length > 0
                    ? await db
                          .select({
                              userId: projectMembers.userId,
                              id: projects.id,
                              name: projects.name,
                              color: projects.color,
                          })
                          .from(projectMembers)
                          .innerJoin(
                              projects,
                              eq(projects.id, projectMembers.projectId),
                          )
                          .where(
                              and(
                                  inArray(
                                      projectMembers.userId,
                                      members.map((member) => member.user.id),
                                  ),
                                  isNull(projectMembers.leftAt),
                                  eq(projects.organizationId, organizationId),
                                  isNull(projects.deletedAt),
                              ),
                          )
                          .orderBy(asc(projects.name))
                    : [];

            return members.map((member) => ({
                ...member,
                projects: memberships
                    .filter((row) => row.userId === member.user.id)
                    .map(({ id, name, color }) => ({ id, name, color })),
            }));
        },
    );

async function findManageableMember(
    memberId: string,
    actor: { userId: string; organizationId: string; role: OrganizationRole },
): Promise<OrganizationMemberRecord> {
    const [member] = await db
        .select()
        .from(organizationMembers)
        .where(
            and(
                eq(organizationMembers.id, memberId),
                eq(organizationMembers.organizationId, actor.organizationId),
                isNull(organizationMembers.leftAt),
            ),
        )
        .limit(1);

    if (!member) throw new ApplicationError('Участник не найден');
    if (member.userId === actor.userId) {
        throw new ApplicationError('С собственной учётной записью так нельзя');
    }
    if (member.role === OrganizationRole.OWNER) {
        throw new ApplicationError('С владельцем организации так нельзя');
    }
    if (
        member.role === OrganizationRole.ADMIN &&
        actor.role !== OrganizationRole.OWNER
    ) {
        throw new ApplicationError(
            'С администратором так может только владелец',
        );
    }

    return member;
}

export const changeOrganizationMemberRoleAction = organizationMutationAction(
    Permission.MANAGE_ROLES,
)
    .inputSchema(ChangeOrganizationMemberRoleActionInputSchema)
    .action(
        async ({
            parsedInput: { memberId, role },
            ctx: { userId, organizationId, role: actorRole },
        }) => {
            const member = await findManageableMember(memberId, {
                userId,
                organizationId,
                role: actorRole,
            });

            if (role === OrganizationRole.OWNER) {
                throw new ApplicationError('Владелец у организации один');
            }
            if (
                role === OrganizationRole.ADMIN &&
                actorRole !== OrganizationRole.OWNER
            ) {
                throw new ApplicationError(
                    'Администраторов назначает только владелец',
                );
            }
            if (member.role === role) return member;

            const updated = await updateOne(
                organizationMembers,
                eq(organizationMembers.id, member.id),
                { role },
                'Участник не найден',
            );

            await recordAudit({
                organizationId,
                actorUserId: userId,
                action: AuditAction.MemberRoleChanged,
                targetType: AuditTargetType.OrganizationMember,
                targetId: member.id,
                summary: 'Изменена роль участника в организации',
                metadata: {
                    userId: member.userId,
                    from: member.role,
                    to: role,
                },
            });

            return updated;
        },
    );

export const offboardOrganizationMemberAction = organizationMutationAction(
    Permission.MANAGE_MEMBERS,
)
    .inputSchema(OffboardOrganizationMemberActionInputSchema)
    .action(
        async ({
            parsedInput: { memberId },
            ctx: { userId, organizationId, role: actorRole },
        }) => {
            const member = await findManageableMember(memberId, {
                userId,
                organizationId,
                role: actorRole,
            });

            const at = new Date();

            await db.transaction(async (tx) => {
                await assertNoOpenWork(tx, { employeeId: member.id });

                await tx
                    .update(organizationMembers)
                    .set({ leftAt: at })
                    .where(eq(organizationMembers.id, member.id));

                await tx
                    .update(projectMembers)
                    .set({ leftAt: at })
                    .where(
                        and(
                            eq(projectMembers.userId, member.userId),
                            isNull(projectMembers.leftAt),
                            inArray(
                                projectMembers.projectId,
                                tx
                                    .select({ id: projects.id })
                                    .from(projects)
                                    .where(
                                        eq(
                                            projects.organizationId,
                                            organizationId,
                                        ),
                                    ),
                            ),
                        ),
                    );

                await endEmployeeAssignment(
                    { organizationId, userId: member.userId },
                    tx,
                );

                await tx
                    .delete(sessions)
                    .where(eq(sessions.userId, member.userId));
            });

            await recordAudit({
                organizationId,
                actorUserId: userId,
                action: AuditAction.MemberOffboarded,
                targetType: AuditTargetType.OrganizationMember,
                targetId: member.id,
                summary: 'Участник уволен из организации',
                metadata: { userId: member.userId, role: member.role },
            });

            return { ok: true };
        },
    );
