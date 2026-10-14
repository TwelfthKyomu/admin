'use server';

import { db } from '@/infrastructure/database/client';
import {
    organizationMemberAction,
    organizationMutationAction,
} from '@/shared/api/action-client';
import { ApplicationError } from '@/shared/api/errors';
import { listProjectPermissions } from '@/shared/api/permission';
import { insertOne, updateOne } from '@/shared/api/repository';
import { recordAudit } from '@/contexts/auditLog/AuditLog.lib';
import {
    AuditAction,
    AuditTargetType,
} from '@/contexts/auditLog/AuditLog.types';
import { ensureEmployeeAssigned } from '@/contexts/employeeAssignment/EmployeeAssignment.lib';
import { projectIntegrations } from '@/contexts/integration/Integrations.table';
import { projectInvites } from '@/contexts/projectInvite/ProjectInvites.table';
import { projectMembers } from '@/contexts/projectMember/ProjectMembers.table';
import { assertPlanLimit } from '@/contexts/subscription/Subscription.lib';
import { Permission } from '@/contexts/user/User.types';
import { and, eq, isNull } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import {
    countOrganizationProjects,
    listOrganizationProjects,
    switchProjectCurrency,
} from './Project.lib';
import {
    CreateProjectActionInputSchema,
    DeleteProjectActionInputSchema,
    ProjectsActionInputSchema,
    UpdateProjectActionInputSchema,
} from './Project.schema';
import { ProjectRole } from './Project.types';
import { projects } from './Projects.table';

export const projectsAction = organizationMemberAction()
    .inputSchema(ProjectsActionInputSchema)
    .action(async ({ ctx: { userId, organizationId } }) => {
        const [all, permissions] = await Promise.all([
            listOrganizationProjects(organizationId),
            listProjectPermissions(userId),
        ]);

        return all.filter((project) => permissions[project.id]);
    });

export const createProjectAction = organizationMutationAction(
    Permission.MANAGE_ORGANIZATION,
)
    .inputSchema(CreateProjectActionInputSchema)
    .action(async ({ parsedInput, ctx: { userId, organizationId } }) => {
        await assertPlanLimit(
            organizationId,
            'projects',
            await countOrganizationProjects(organizationId),
            'проектов',
        );

        const created = await db.transaction(async (tx) => {
            const project = await insertOne(
                projects,
                {
                    organizationId,
                    name: parsedInput.name,
                    type: parsedInput.type,
                    slug: parsedInput.slug.toLowerCase().trim(),
                    key: parsedInput.key.toUpperCase().trim(),
                    description: parsedInput.description?.trim() || null,
                    color: parsedInput.color,
                    defaultCurrency: parsedInput.defaultCurrency,
                },
                'Не удалось создать проект',
                tx,
            );

            await tx.insert(projectMembers).values({
                userId,
                projectId: project.id,
                role: ProjectRole.MANAGER,
            });

            return project;
        });

        await ensureEmployeeAssigned({
            organizationId,
            projectId: created.id,
            userId,
        });

        await recordAudit({
            organizationId,
            projectId: created.id,
            actorUserId: userId,
            action: AuditAction.ProjectCreated,
            targetType: AuditTargetType.Project,
            targetId: created.id,
            summary: `Создан проект «${created.name}»`,
            metadata: { name: created.name },
        });

        revalidatePath('/', 'layout');

        return created;
    });

export const updateProjectAction = organizationMutationAction(
    Permission.MANAGE_ORGANIZATION,
)
    .inputSchema(UpdateProjectActionInputSchema)
    .action(
        async ({ parsedInput: { id, ...patch }, ctx: { organizationId } }) => {
            const project = await db.transaction(async (tx) => {
                const where = and(
                    eq(projects.id, id),
                    eq(projects.organizationId, organizationId),
                    isNull(projects.deletedAt),
                );

                const [current] = await tx
                    .select({ defaultCurrency: projects.defaultCurrency })
                    .from(projects)
                    .where(where)
                    .limit(1)
                    .for('update');

                if (!current) throw new ApplicationError('Проект не найден');

                const currencyChanged =
                    patch.defaultCurrency !== undefined &&
                    patch.defaultCurrency !== current.defaultCurrency;

                if (currencyChanged && patch.defaultCurrency) {
                    await switchProjectCurrency(tx, id, patch.defaultCurrency);
                }

                return updateOne(
                    projects,
                    where,
                    patch,
                    'Проект не найден',
                    tx,
                );
            });

            revalidatePath('/', 'layout');

            return project;
        },
    );

export const deleteProjectAction = organizationMutationAction(
    Permission.MANAGE_ORGANIZATION,
)
    .inputSchema(DeleteProjectActionInputSchema)
    .action(
        async ({ parsedInput: { id }, ctx: { userId, organizationId } }) => {
            await db.transaction(async (tx) => {
                await updateOne(
                    projects,
                    and(
                        eq(projects.id, id),
                        eq(projects.organizationId, organizationId),
                        isNull(projects.deletedAt),
                    ),
                    { deletedAt: new Date() },
                    'Не удалось удалить проект',
                    tx,
                );

                await tx
                    .update(projectIntegrations)
                    .set({ isActive: false })
                    .where(eq(projectIntegrations.projectId, id));

                await tx
                    .update(projectInvites)
                    .set({ revokedAt: new Date() })
                    .where(
                        and(
                            eq(projectInvites.projectId, id),
                            isNull(projectInvites.acceptedAt),
                            isNull(projectInvites.revokedAt),
                        ),
                    );
            });

            await recordAudit({
                organizationId,
                projectId: id,
                actorUserId: userId,
                action: AuditAction.ProjectDeleted,
                targetType: AuditTargetType.Project,
                targetId: id,
                summary: 'Удалён проект',
            });

            revalidatePath('/', 'layout');

            return { ok: true };
        },
    );
