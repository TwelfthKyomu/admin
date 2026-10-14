'use server';

import { db } from '@/infrastructure/database/client';
import {
    projectMutationAction,
    projectReadAction,
} from '@/shared/api/action-client';
import {
    insertOne,
    softDeleteInProject,
    updateInProject,
} from '@/shared/api/repository';
import { cleanupProjectFiles } from '@/contexts/projectFile/ProjectFile.lib';
import {
    CATALOG_READ_PERMISSIONS,
    Permission,
} from '@/contexts/user/User.types';
import {
    findLookInProject,
    loadProjectLooks,
    replaceLookItems,
} from './Look.lib';
import {
    CreateLookActionInputSchema,
    DeleteLookActionInputSchema,
    LooksActionInputSchema,
    UpdateLookActionInputSchema,
} from './Look.schema';
import { projectLooks } from './Looks.table';

export const looksAction = projectReadAction(CATALOG_READ_PERMISSIONS)
    .inputSchema(LooksActionInputSchema)
    .action(({ parsedInput: { projectId } }) =>
        loadProjectLooks(projectId, false),
    );

export const createLookAction = projectMutationAction(Permission.MANAGE_CATALOG)
    .inputSchema(CreateLookActionInputSchema)
    .action(({ parsedInput: { items, ...input } }) =>
        db.transaction(async (tx) => {
            const look = await insertOne(
                projectLooks,
                {
                    projectId: input.projectId,
                    title: input.title.trim(),
                    description: input.description ?? null,
                    image: input.image,
                    isActive: input.isActive ?? true,
                },
                'Не удалось создать образ',
                tx,
            );

            await replaceLookItems(tx, look, items);

            return { ...look, items };
        }),
    );

export const updateLookAction = projectMutationAction(Permission.MANAGE_CATALOG)
    .inputSchema(UpdateLookActionInputSchema)
    .action(
        async ({
            parsedInput: { id, projectId, items, ...input },
            ctx: { organizationId },
        }) => {
            const look = await findLookInProject(id, projectId);

            const updated = await db.transaction(async (tx) => {
                const saved = await updateInProject(
                    projectLooks,
                    id,
                    projectId,
                    {
                        title: input.title.trim(),
                        description: input.description ?? null,
                        image: input.image,
                        isActive: input.isActive,
                    },
                    'Образ не найден',
                    tx,
                );

                await replaceLookItems(tx, saved, items);

                return { ...saved, items };
            });

            if (look.image !== updated.image) {
                await cleanupProjectFiles(organizationId, projectId, [
                    look.image,
                ]).catch(() => undefined);
            }

            return updated;
        },
    );

export const deleteLookAction = projectMutationAction(Permission.MANAGE_CATALOG)
    .inputSchema(DeleteLookActionInputSchema)
    .action(
        async ({ parsedInput: { id, projectId }, ctx: { organizationId } }) => {
            const look = await findLookInProject(id, projectId);

            const result = await softDeleteInProject(
                projectLooks,
                id,
                projectId,
                'Образ не найден',
            );

            await cleanupProjectFiles(organizationId, projectId, [
                look.image,
            ]).catch(() => undefined);

            return result;
        },
    );
