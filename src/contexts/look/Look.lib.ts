import 'server-only';

import { db, type Tx } from '@/infrastructure/database/client';
import { findInProject } from '@/shared/api/repository';
import { and, asc, eq, inArray, isNull } from 'drizzle-orm';
import {
    type LookItem,
    type ProjectLookRecord,
    type ProjectLookView,
    projectLookItems,
    projectLooks,
} from './Looks.table';

export function findLookInProject(
    id: string,
    projectId: string,
): Promise<ProjectLookRecord> {
    return findInProject(projectLooks, id, projectId, 'Образ не найден');
}

export async function loadProjectLooks(
    projectId: string,
    onlyActive: boolean,
): Promise<ProjectLookView[]> {
    const looks = await db
        .select()
        .from(projectLooks)
        .where(
            and(
                eq(projectLooks.projectId, projectId),
                isNull(projectLooks.deletedAt),
                onlyActive ? eq(projectLooks.isActive, true) : undefined,
            ),
        )
        .orderBy(asc(projectLooks.position), asc(projectLooks.createdAt));

    const items = looks.length
        ? await db
              .select()
              .from(projectLookItems)
              .where(
                  inArray(
                      projectLookItems.lookId,
                      looks.map((look) => look.id),
                  ),
              )
              .orderBy(asc(projectLookItems.position))
        : [];

    const itemsByLook = Map.groupBy(items, (item) => item.lookId);

    return looks.map((look) => ({
        ...look,
        items: (itemsByLook.get(look.id) ?? []).map(({ productId, x, y }) => ({
            productId,
            x,
            y,
        })),
    }));
}

export async function replaceLookItems(
    tx: Tx,
    look: Pick<ProjectLookRecord, 'id' | 'projectId'>,
    items: readonly LookItem[],
): Promise<void> {
    await tx
        .delete(projectLookItems)
        .where(eq(projectLookItems.lookId, look.id));

    if (items.length === 0) return;

    await tx.insert(projectLookItems).values(
        items.map((item, position) => ({
            lookId: look.id,
            projectId: look.projectId,
            productId: item.productId,
            x: item.x,
            y: item.y,
            position,
        })),
    );
}
