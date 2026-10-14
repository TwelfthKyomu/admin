import 'server-only';

import { db } from '@/infrastructure/database/client';
import {
    deleteProjectFile,
    parseUploadUrl,
} from '@/infrastructure/storage/uploads';
import { insertOne } from '@/shared/api/repository';
import { projectLooks } from '@/contexts/look/Looks.table';
import { products } from '@/contexts/product/Products.table';
import { and, arrayOverlaps, eq, inArray, isNull, lt } from 'drizzle-orm';
import { type ProjectFileRecord, projectFiles } from './ProjectFiles.table';

const ABANDONED_UPLOAD_MS = 24 * 60 * 60 * 1000;

export async function createProjectFile(input: {
    projectId: string;
    url: string;
    sizeBytes: number;
}): Promise<ProjectFileRecord> {
    return insertOne(projectFiles, input, 'Не удалось записать файл проекта');
}

export async function cleanupProjectFiles(
    organizationId: string,
    projectId: string,
    removedUrls: readonly string[],
): Promise<void> {
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
}
