'use server';

import { db } from '@/infrastructure/database/client';
import {
    projectMutationAction,
    projectReadAction,
} from '@/shared/api/action-client';
import { ApplicationError } from '@/shared/api/errors';
import {
    assertUniqueInProject,
    findInProject,
    insertOne,
    updateInProject,
} from '@/shared/api/repository';
import { productBadges } from '@/contexts/product/Products.table';
import { assertPlanLimit } from '@/contexts/subscription/Subscription.lib';
import {
    CATALOG_READ_PERMISSIONS,
    Permission,
} from '@/contexts/user/User.types';
import { and, asc, count, eq, isNull } from 'drizzle-orm';
import {
    CreateProjectBadgeActionInputSchema,
    DeleteProjectBadgeActionInputSchema,
    ProjectBadgesActionInputSchema,
    UpdateProjectBadgeActionInputSchema,
} from './ProjectBadge.schema';
import {
    normalizeBadgeCode,
    PROJECT_BADGE_DEFAULT_COLOR,
} from './ProjectBadge.types';
import { type ProjectBadgeRecord, projectBadges } from './ProjectBadges.table';

function findBadgeInProject(
    id: string,
    projectId: string,
): Promise<ProjectBadgeRecord> {
    return findInProject(projectBadges, id, projectId, 'Бейдж не найден');
}

export const projectBadgesAction = projectReadAction(CATALOG_READ_PERMISSIONS)
    .inputSchema(ProjectBadgesActionInputSchema)
    .action(async ({ parsedInput: { projectId, includeInactive } }) => {
        const filters = [
            eq(projectBadges.projectId, projectId),
            isNull(projectBadges.deletedAt),
        ];

        if (!includeInactive) filters.push(eq(projectBadges.isActive, true));

        return db
            .select()
            .from(projectBadges)
            .where(and(...filters))
            .orderBy(asc(projectBadges.position), asc(projectBadges.label));
    });

export const createProjectBadgeAction = projectMutationAction(
    Permission.MANAGE_CATALOG,
)
    .inputSchema(CreateProjectBadgeActionInputSchema)
    .action(async ({ parsedInput, ctx: { organizationId } }) => {
        const label = parsedInput.label.trim();
        const codeSource = parsedInput.code?.trim() || label;
        const code = normalizeBadgeCode(codeSource);

        if (!code) {
            throw new ApplicationError(`Неверный код бейджа: «${codeSource}»`);
        }

        const [[used]] = await Promise.all([
            db
                .select({ value: count() })
                .from(projectBadges)
                .where(
                    and(
                        eq(projectBadges.projectId, parsedInput.projectId),
                        isNull(projectBadges.deletedAt),
                    ),
                ),
            assertUniqueInProject({
                table: projectBadges,
                column: projectBadges.code,
                value: code,
                projectId: parsedInput.projectId,
                conflict: `Бейдж «${code}» уже есть в проекте`,
            }),
        ]);

        await assertPlanLimit(
            organizationId,
            'badgesPerProject',
            used?.value ?? 0,
            'бейджей',
        );

        return insertOne(
            projectBadges,
            {
                projectId: parsedInput.projectId,
                code,
                label,
                color: parsedInput.color ?? PROJECT_BADGE_DEFAULT_COLOR,
                position: parsedInput.position ?? 0,
                isActive: parsedInput.isActive ?? true,
            },
            'Не удалось создать бейдж',
        );
    });

export const updateProjectBadgeAction = projectMutationAction(
    Permission.MANAGE_CATALOG,
)
    .inputSchema(UpdateProjectBadgeActionInputSchema)
    .action(({ parsedInput }) =>
        updateInProject(
            projectBadges,
            parsedInput.id,
            parsedInput.projectId,
            {
                label: parsedInput.label?.trim(),
                color: parsedInput.color?.trim(),
                position: parsedInput.position,
                isActive: parsedInput.isActive,
            },
            'Бейдж не найден',
        ),
    );

export const deleteProjectBadgeAction = projectMutationAction(
    Permission.MANAGE_CATALOG,
)
    .inputSchema(DeleteProjectBadgeActionInputSchema)
    .action(async ({ parsedInput: { id, projectId } }) => {
        const badge = await findBadgeInProject(id, projectId);

        return db.transaction(async (tx) => {
            const cleaned = await tx
                .delete(productBadges)
                .where(eq(productBadges.badgeId, badge.id))
                .returning({ productId: productBadges.productId });

            await tx
                .update(projectBadges)
                .set({ deletedAt: new Date() })
                .where(eq(projectBadges.id, badge.id));

            return { ok: true, cleanedProductsCount: cleaned.length };
        });
    });
