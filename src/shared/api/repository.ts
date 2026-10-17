import 'server-only';

import { db, type Tx } from '@/infrastructure/database/client';
import { ApplicationError } from '@/shared/api/errors';
import {
    and,
    eq,
    type InferInsertModel,
    type InferSelectModel,
    ilike,
    isNull,
    ne,
    or,
    type SQL,
} from 'drizzle-orm';
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core';

type Executor = Pick<typeof db, 'insert' | 'update'>;

type ProjectScoped = PgTable & {
    id: PgColumn;
    projectId: PgColumn;
    deletedAt?: PgColumn;
};

function alive(table: ProjectScoped) {
    return table.deletedAt ? isNull(table.deletedAt) : undefined;
}

export async function findInProject<T extends ProjectScoped>(
    table: T,
    id: string,
    projectId: string,
    notFound: string,
): Promise<InferSelectModel<T>> {
    const [row] = (await db
        .select()
        .from(table as PgTable)
        .where(
            and(eq(table.id, id), eq(table.projectId, projectId), alive(table)),
        )
        .limit(1)) as InferSelectModel<T>[];

    if (!row) throw new ApplicationError(notFound);

    return row;
}

export async function lockInProject<T extends ProjectScoped>(
    tx: Tx,
    table: T,
    id: string,
    projectId: string,
    notFound: string,
): Promise<InferSelectModel<T>> {
    const [row] = (await tx
        .select()
        .from(table as PgTable)
        .where(
            and(eq(table.id, id), eq(table.projectId, projectId), alive(table)),
        )
        .limit(1)
        .for('update')) as InferSelectModel<T>[];

    if (!row) throw new ApplicationError(notFound);

    return row;
}

export async function assertUniqueInProject(opts: {
    table: ProjectScoped;
    column: PgColumn;
    value: unknown;
    projectId: string;
    excludeId?: string;
    conflict: string;
}): Promise<void> {
    const { table, column, value, projectId, excludeId, conflict } = opts;

    const [taken] = await db
        .select({ id: table.id })
        .from(table)
        .where(
            and(
                eq(table.projectId, projectId),
                eq(column, value),
                alive(table),
                excludeId ? ne(table.id, excludeId) : undefined,
            ),
        )
        .limit(1);

    if (taken) throw new ApplicationError(conflict);
}

export async function insertOne<T extends PgTable>(
    table: T,
    values: InferInsertModel<T>,
    failed: string,
    executor: Executor = db,
): Promise<InferSelectModel<T>> {
    const [row] = (await executor
        .insert(table)
        .values(values as never)
        .returning()) as InferSelectModel<T>[];

    if (!row) throw new ApplicationError(failed);

    return row;
}

export async function updateOne<T extends PgTable>(
    table: T,
    where: SQL | undefined,
    patch: Partial<InferInsertModel<T>>,
    notFound: string,
    executor: Executor = db,
): Promise<InferSelectModel<T>> {
    const [row] = (await executor
        .update(table)
        .set(patch as never)
        .where(where)
        .returning()) as InferSelectModel<T>[];

    if (!row) throw new ApplicationError(notFound);

    return row;
}

export function updateInProject<T extends ProjectScoped>(
    table: T,
    id: string,
    projectId: string,
    patch: Partial<InferInsertModel<T>>,
    notFound: string,
    executor: Executor = db,
): Promise<InferSelectModel<T>> {
    return updateOne(
        table,
        and(eq(table.id, id), eq(table.projectId, projectId), alive(table)),
        patch,
        notFound,
        executor,
    );
}

export async function softDeleteInProject(
    table: ProjectScoped & { deletedAt: PgColumn },
    id: string,
    projectId: string,
    notFound: string,
): Promise<{ ok: true }> {
    await updateInProject(
        table,
        id,
        projectId,
        { deletedAt: new Date() } as never,
        notFound,
    );

    return { ok: true };
}

export async function deleteInProject(
    table: ProjectScoped,
    id: string,
    projectId: string,
    notFound: string,
): Promise<{ ok: true }> {
    const [row] = await db
        .delete(table)
        .where(and(eq(table.id, id), eq(table.projectId, projectId)))
        .returning({ id: table.id });

    if (!row) throw new ApplicationError(notFound);

    return { ok: true };
}

export function searchFilters(
    term: string | undefined | null,
    columns: PgColumn[],
): SQL[] {
    const value = term?.trim();

    if (!value) return [];

    const pattern = `%${value.replace(/[\\%_]/g, '\\$&')}%`;
    const clause = or(...columns.map((column) => ilike(column, pattern)));

    return clause ? [clause] : [];
}
