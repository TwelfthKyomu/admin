import { createdAt, deletedAt, id } from '@/infrastructure/database/columns';
import { projects } from '@/contexts/project/Projects.table';
import { isNull } from 'drizzle-orm';
import {
    boolean,
    index,
    integer,
    pgTable,
    text,
    unique,
    uniqueIndex,
    varchar,
} from 'drizzle-orm/pg-core';

export const projectBadges = pgTable(
    'project_badges',
    {
        id,
        projectId: text('project_id')
            .notNull()
            .references(() => projects.id, { onDelete: 'cascade' }),
        code: varchar('code', { length: 32 }).notNull(),
        label: varchar('label', { length: 64 }).notNull(),
        color: varchar('color', { length: 9 }).notNull().default('#737373'),
        position: integer('position').notNull().default(0),
        isActive: boolean('is_active').notNull().default(true),
        deletedAt,
        createdAt,
    },
    (t) => [
        unique('project_badges_id_project_unique').on(t.id, t.projectId),
        uniqueIndex('project_badges_project_code_unique')
            .on(t.projectId, t.code)
            .where(isNull(t.deletedAt)),
        index('project_badges_project_idx').on(t.projectId),
        index('project_badges_active_idx').on(t.isActive),
    ],
);

export type ProjectBadgeRecord = typeof projectBadges.$inferSelect;
export type NewProjectBadgeRecord = typeof projectBadges.$inferInsert;

export type ProjectBadgeView = ProjectBadgeRecord;
