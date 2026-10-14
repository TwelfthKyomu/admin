import { createdAt, deletedAt, id } from '@/infrastructure/database/columns';
import { projectCategoryTypeEnum } from '@/infrastructure/database/schemas/enums';
import { projects } from '@/contexts/project/Projects.table';
import { isNull } from 'drizzle-orm';
import {
    type AnyPgColumn,
    boolean,
    check,
    foreignKey,
    index,
    integer,
    pgTable,
    text,
    unique,
    uniqueIndex,
    varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm/sql';
import { ProjectCategoryType } from './ProjectCategory.types';

export const projectCategories = pgTable(
    'project_categories',
    {
        id,
        projectId: text('project_id')
            .notNull()
            .references(() => projects.id, { onDelete: 'cascade' }),
        parentId: text('parent_id').references(
            (): AnyPgColumn => projectCategories.id,
            {
                onDelete: 'cascade',
            },
        ),
        name: varchar('name', { length: 120 }).notNull(),
        slug: varchar('slug', { length: 140 }).notNull(),
        type: projectCategoryTypeEnum('type')
            .notNull()
            .default(ProjectCategoryType.GENERIC),
        position: integer('position').notNull().default(0),
        isActive: boolean('is_active').notNull().default(true),
        deletedAt,
        createdAt,
    },
    (t) => [
        unique('project_categories_id_project_unique').on(t.id, t.projectId),

        foreignKey({
            columns: [t.parentId, t.projectId],
            foreignColumns: [t.id, t.projectId],
            name: 'project_categories_parent_project_fk',
        }),

        index('project_categories_project_idx').on(t.projectId),
        index('project_categories_parent_idx').on(t.parentId),
        index('project_categories_project_parent_position_idx').on(
            t.projectId,
            t.parentId,
            t.position,
        ),
        uniqueIndex('project_categories_project_parent_slug_unique')
            .on(t.projectId, sql`coalesce(${t.parentId}, '')`, t.slug)
            .where(isNull(t.deletedAt)),
        check(
            'project_categories_name_not_empty',
            sql`length(trim(${t.name})) >= 1`,
        ),
        check(
            'project_categories_no_self_parent',
            sql`${t.parentId} IS NULL OR ${t.parentId} <> ${t.id}`,
        ),
    ],
);

export type ProjectCategoryRecord = typeof projectCategories.$inferSelect;
export type NewProjectCategoryRecord = typeof projectCategories.$inferInsert;

export type ProjectCategoryView = ProjectCategoryRecord;
