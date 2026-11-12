import 'server-only';

import { db } from '@/infrastructure/database/client';
import {
    deleteProjectFile,
    projectFileResponse,
} from '@/infrastructure/storage/uploads';
import { parseUploadUrl } from '@/infrastructure/storage/uploadUrls';
import { requireProjectPermission } from '@/shared/api/permission';
import { insertOne } from '@/shared/api/repository';
import { forbiddenResponse } from '@/shared/api/response';
import { projectLooks } from '@/contexts/look/Looks.table';
import { products } from '@/contexts/product/Products.table';
import { CATALOG_READ_PERMISSIONS } from '@/contexts/user/User.types';
import { and, arrayOverlaps, eq, inArray, isNull, lt } from 'drizzle-orm';
import { type ProjectFileRecord, projectFiles } from './ProjectFiles.table';

const ABANDONED_UPLOAD_MS = 24 * 60 * 60 * 1000;

export const createProjectFile = async (input: {
    projectId: string;
    url: string;
    sizeBytes: number;
}): Promise<ProjectFileRecord> => {
    return insertOne(projectFiles, input, 'Не удалось записать файл проекта');
};

export const cleanupProjectFiles = async (
    organizationId: string,
    projectId: string,
    removedUrls: readonly string[],
): Promise<void> => {
    const oldFiles = await db
        .select({ url: projectFiles.url })
        .from(projectFiles)
        .where(
            and(
                eq(projectFiles.projectId, projectId),
                lt(
                    projectFiles.createdAt,
                    new Date(Date.now() - ABANDONED_UPLOAD_MS),
                ),
            ),
        );

    const unused = new Set([...removedUrls, ...oldFiles.map(({ url }) => url)]);

    if (unused.size === 0) return;

    const stillUsed = await db
        .select({ images: products.images })
        .from(products)
        .where(
            and(
                eq(products.projectId, projectId),
                isNull(products.deletedAt),
                arrayOverlaps(products.images, [...unused]),
            ),
        );

    for (const { images } of stillUsed) {
        for (const url of images) unused.delete(url);
    }

    const usedInLooks = await db
        .select({ image: projectLooks.image })
        .from(projectLooks)
        .where(
            and(
                eq(projectLooks.projectId, projectId),
                isNull(projectLooks.deletedAt),
                inArray(projectLooks.image, [...unused]),
            ),
        );

    for (const { image } of usedInLooks) unused.delete(image);

    await Promise.allSettled(
        [...unused].map(async (url) => {
            const location = parseUploadUrl(url);

            if (
                location?.kind !== 'project' ||
                location.projectId !== projectId
            )
                return;

            await deleteProjectFile(
                organizationId,
                projectId,
                location.filename,
            );

            await db
                .delete(projectFiles)
                .where(
                    and(
                        eq(projectFiles.projectId, projectId),
                        eq(projectFiles.url, url),
                    ),
                );
        }),
    );
};

export const serveProjectFile = async (
    userId: string,
    projectId: string,
    filename: string,
    contentType: string,
): Promise<Response> => {
    let organizationId: string;

    try {
        ({ organizationId } = await requireProjectPermission(
            userId,
            projectId,
            CATALOG_READ_PERMISSIONS,
        ));
    } catch {
        return forbiddenResponse();
    }

    return projectFileResponse(
        organizationId,
        projectId,
        filename,
        contentType,
    );
};
