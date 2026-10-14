import { id } from '@/infrastructure/database/columns';
import { projects } from '@/contexts/project/Projects.table';
import {
    bigint,
    index,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
    varchar,
} from 'drizzle-orm/pg-core';

export const projectFiles = pgTable(
    'project_files',
    {
        id,
        projectId: text('project_id')
            .notNull()
            .references(() => projects.id, { onDelete: 'cascade' }),
        url: varchar('url', { length: 2048 }).notNull(),
        sizeBytes: bigint('size_bytes', { mode: 'number' }).notNull(),
        createdAt: timestamp('created_at').notNull().defaultNow(),
    },
    (t) => [
        uniqueIndex('project_files_project_url_unique').on(t.projectId, t.url),
        index('project_files_project_idx').on(t.projectId),
    ],
);

export type ProjectFileRecord = typeof projectFiles.$inferSelect;
