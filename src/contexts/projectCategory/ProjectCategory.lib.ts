import 'server-only';

import { db } from '@/infrastructure/database/client';
import { ApplicationError } from '@/shared/api/errors';
import { and, count, eq, inArray, isNull, ne } from 'drizzle-orm';
import { projectCategories } from './ProjectCategories.table';

export async function findCategoryDescendantIds(
    rootIds: string[],
): Promise<string[]> {
    const seen = new Set<string>(rootIds);
    let frontier = [...seen];

    while (frontier.length > 0) {
        const rows = await db
            .select({ id: projectCategories.id })
            .from(projectCategories)
            .where(
                and(
                    inArray(projectCategories.parentId, frontier),
                    isNull(projectCategories.deletedAt),
                ),
            );

        frontier = rows.map((row) => row.id).filter((id) => !seen.has(id));

        for (const id of frontier) seen.add(id);
    }

    for (const id of rootIds) seen.delete(id);

    return [...seen];
}

export async function assertCategorySlugFree(input: {
    projectId: string;
    parentId: string | null;
    slug: string;
    excludeId?: string;
}): Promise<void> {
    const [taken] = await db
        .select({ id: projectCategories.id })
        .from(projectCategories)
        .where(
            and(
                eq(projectCategories.projectId, input.projectId),
                input.parentId === null
                    ? isNull(projectCategories.parentId)
                    : eq(projectCategories.parentId, input.parentId),
                eq(projectCategories.slug, input.slug),
                isNull(projectCategories.deletedAt),
                input.excludeId
                    ? ne(projectCategories.id, input.excludeId)
                    : undefined,
            ),
        )
        .limit(1);

    if (taken) {
        throw new ApplicationError(
            `Категория со slug «${input.slug}» уже есть на этом уровне`,
        );
    }
}

export async function nextCategoryPosition(
    projectId: string,
    parentId: string | null,
): Promise<number> {
    const [row] = await db
        .select({ value: count() })
        .from(projectCategories)
        .where(
            and(
                eq(projectCategories.projectId, projectId),
                isNull(projectCategories.deletedAt),
                parentId === null
                    ? isNull(projectCategories.parentId)
                    : eq(projectCategories.parentId, parentId),
            ),
        );

    return row?.value ?? 0;
}
