import { createdAt, deletedAt, id } from '@/infrastructure/database/columns';
import {
    currencyEnum,
    projectTypeEnum,
} from '@/infrastructure/database/schemas/enums';
import { organizations } from '@/contexts/organization/Organizations.table';
import { isNull } from 'drizzle-orm';
import {
    check,
    index,
    integer,
    pgTable,
    text,
    unique,
    uniqueIndex,
    varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm/sql';
import { ProjectType } from './Project.types';

export const projects = pgTable(
    'projects',
    {
        id,
        organizationId: text('organization_id')
            .notNull()
            .references(() => organizations.id, { onDelete: 'cascade' }),
        name: varchar('name', { length: 255 }).notNull(),
        type: projectTypeEnum('type').notNull().default(ProjectType.SHOP),
        slug: varchar('slug', { length: 100 }).notNull(),
        key: varchar('key', { length: 10 }).notNull(),
        description: text('description'),
        color: varchar('color', { length: 7 }).notNull().default('#3b82f6'),
        defaultCurrency: currencyEnum('default_currency')
            .notNull()
            .default('RUB'),
        taskCounter: integer('task_counter').notNull().default(0),
        deletedAt,
        createdAt,
    },
    (t) => [
        uniqueIndex('projects_organization_slug_unique')
            .on(t.organizationId, t.slug)
            .where(isNull(t.deletedAt)),
        uniqueIndex('projects_organization_key_unique')
            .on(t.organizationId, t.key)
            .where(isNull(t.deletedAt)),
        index('projects_organization_id_idx').on(t.organizationId),
        check('key_format', sql`${t.key} ~ '^[A-Z]{2,10}$'`),
        unique('projects_id_org_unique').on(t.id, t.organizationId),
    ],
);

export type ProjectRecord = typeof projects.$inferSelect;

export type ProjectView = ProjectRecord;
