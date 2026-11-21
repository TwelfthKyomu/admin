import 'server-only';

import { db, type Tx } from '@/infrastructure/database/client';
import { inProjectFinder, listInProject } from '@/shared/api/repository';
import { asc, eq, inArray } from 'drizzle-orm';
import {
    type LookItem,
    type ProjectLookRecord,
    type ProjectLookView,
    projectLookItems,
    projectLooks,
} from './Looks.table';

export const findLookInProject = inProjectFinder(
    projectLooks,
    'Образ не найден',
);

export const loadProjectLooks = async (
    projectId: string,
    onlyActive: boolean,
): Promise<ProjectLookView[]> => {
    const looks = await listInProject(projectLooks, projectId, {
        includeInactive: !onlyActive,
        orderBy: [asc(projectLooks.position), asc(projectLooks.createdAt)],
    });

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
};

export const replaceLookItems = async (
    tx: Tx,
    look: Pick<ProjectLookRecord, 'id' | 'projectId'>,
    items: readonly LookItem[],
): Promise<void> => {
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
};
