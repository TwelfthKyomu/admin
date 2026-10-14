'use server';

import { db } from '@/infrastructure/database/client';
import {
    projectMutationAction,
    projectReadAction,
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
    ensureEmployeeAssigned,
    syncAssignmentKindWithRole,
} from '@/contexts/employeeAssignment/EmployeeAssignment.lib';
import { employeeAssignments } from '@/contexts/employeeAssignment/EmployeeAssignments.table';
import { findMemberIdByUserId } from '@/contexts/organizationMember/OrganizationMember.lib';
import { organizationMembers } from '@/contexts/organizationMember/OrganizationMembers.table';
import { Permission } from '@/contexts/user/User.types';
import { users } from '@/contexts/user/Users.table';
import { and, asc, eq, isNull } from 'drizzle-orm';
import {
    findActiveProjectMember,
    findProjectMemberInProject,
} from './ProjectMember.lib';
import {
    ChangeProjectMemberRoleActionInputSchema,
    DetachProjectMemberActionInputSchema,
    EnsureMemberScheduleActionInputSchema,
    ProjectMembersActionInputSchema,
} from './ProjectMember.schema';
import type { ProjectMemberView } from './ProjectMember.types';
import { projectMembers } from './ProjectMembers.table';

export const projectMembersAction = projectReadAction(Permission.VIEW_MEMBERS)
    .inputSchema(ProjectMembersActionInputSchema)
    .action(
        async ({
            parsedInput: { projectId },
            ctx: { organizationId },
        }): Promise<ProjectMemberView[]> => {
            const rows = await db
                .select({
                    id: projectMembers.id,
                    userId: projectMembers.userId,
                    userName: users.name,
                    userEmail: users.email,
                    projectRole: projectMembers.role,
                    organizationRole: organizationMembers.role,
                    assignmentId: employeeAssignments.id,
                    joinedAt: projectMembers.joinedAt,
                })
                .from(projectMembers)
                .innerJoin(users, eq(projectMembers.userId, users.id))
                .leftJoin(
                    organizationMembers,
                    and(
                        eq(organizationMembers.userId, projectMembers.userId),
                        eq(organizationMembers.organizationId, organizationId),
                        isNull(organizationMembers.leftAt),
                    ),
                )
                .leftJoin(
                    employeeAssignments,
                    and(
                        eq(
                            employeeAssignments.employeeId,
                            organizationMembers.id,
                        ),
                        eq(
                            employeeAssignments.projectId,
                            projectMembers.projectId,
                        ),
                        isNull(employeeAssignments.endedAt),
                    ),
                )
                .where(
                    and(
                        eq(projectMembers.projectId, projectId),
                        isNull(projectMembers.leftAt),
                    ),
                )
                .orderBy(asc(projectMembers.joinedAt));

            return rows.map(({ assignmentId, ...row }) => ({
                ...row,
                organizationRole: row.organizationRole ?? null,
                inSchedule: assignmentId !== null,
            }));
        },
    );

export const changeProjectMemberRoleAction = projectMutationAction(
    Permission.MANAGE_ROLES,
)
    .inputSchema(ChangeProjectMemberRoleActionInputSchema)
    .action(
        async ({
            parsedInput: { projectId, memberId, role },
            ctx: { userId, organizationId },
        }) => {
            const member = await findProjectMemberInProject(
                memberId,
                projectId,
            );

            if (member.leftAt) throw new ApplicationError('Участник не найден');
            if (member.userId === userId) {
                throw new ApplicationError('Нельзя менять собственную роль');
            }
            if (member.role === role) return member;

            const updated = await db.transaction(async (tx) => {
                const row = await updateOne(
                    projectMembers,
                    eq(projectMembers.id, member.id),
                    { role },
                    'Участник не найден',
                    tx,
                );

                await syncAssignmentKindWithRole(
                    {
                        organizationId,
                        projectId,
                        userId: member.userId,
                        from: member.role,
                        to: role,
                    },
                    tx,
                );

                return row;
            });

            await recordAudit({
                organizationId,
                projectId,
                actorUserId: userId,
                action: AuditAction.MemberRoleChanged,
                targetType: AuditTargetType.ProjectMember,
                targetId: member.id,
                summary: 'Изменена роль участника в проекте',
                metadata: {
                    userId: member.userId,
                    from: member.role,
                    to: role,
                },
            });

            return updated;
        },
    );

export const ensureMemberScheduleAction = projectMutationAction(
    Permission.MANAGE_MEMBERS,
)
    .inputSchema(EnsureMemberScheduleActionInputSchema)
    .action(async ({ parsedInput, ctx: { organizationId } }) => {
        const member = await findActiveProjectMember(
            parsedInput.projectId,
            parsedInput.userId,
        );

        if (!member) {
            throw new ApplicationError('Участник не привязан к проекту');
        }

        await ensureEmployeeAssigned({
            organizationId,
            projectId: parsedInput.projectId,
            userId: parsedInput.userId,
        });

        return { ok: true };
    });

export const detachProjectMemberAction = projectMutationAction(
    Permission.MANAGE_MEMBERS,
)
    .inputSchema(DetachProjectMemberActionInputSchema)
    .action(
        async ({
            parsedInput: { projectId, memberId },
            ctx: { userId, organizationId },
        }) => {
            const found = await findProjectMemberInProject(memberId, projectId);

            if (found.leftAt) {
                throw new ApplicationError('Участник уже вышел');
            }
            if (found.userId === userId) {
                throw new ApplicationError('Нельзя убрать из проекта себя');
            }

            const employeeId = await findMemberIdByUserId(
                organizationId,
                found.userId,
            );

            const member = await db.transaction(async (tx) => {
                if (employeeId) {
                    await assertNoOpenWork(tx, { employeeId, projectId });
                }

                const detached = await updateOne(
                    projectMembers,
                    eq(projectMembers.id, memberId),
                    { leftAt: new Date() },
                    'Участник не найден',
                    tx,
                );

                await endEmployeeAssignment(
                    {
                        organizationId,
                        projectId: detached.projectId,
                        userId: detached.userId,
                    },
                    tx,
                );

                return detached;
            });

            await recordAudit({
                organizationId,
                projectId: member.projectId,
                actorUserId: userId,
                action: AuditAction.ProjectMemberDetached,
                targetType: AuditTargetType.ProjectMember,
                targetId: member.id,
                summary: 'Участник отвязан от проекта',
                metadata: { userId: member.userId },
            });

            return member;
        },
    );
