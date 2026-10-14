import { createdAt, deletedAt, id } from '@/infrastructure/database/columns';
import { products } from '@/contexts/product/Products.table';
import { projects } from '@/contexts/project/Projects.table';
import { sql } from 'drizzle-orm';
import {
    boolean,
    check,
    foreignKey,
    index,
    integer,
    pgTable,
    text,
    unique,
    varchar,
} from 'drizzle-orm/pg-core';

export const projectLooks = pgTable(
    'project_looks',
    {
        id,
        projectId: text('project_id')
            .notNull()
            .references(() => projects.id, { onDelete: 'cascade' }),
        title: varchar('title', { length: 64 }).notNull(),
        description: text('description'),
        image: text('image').notNull(),
        position: integer('position').notNull().default(0),
        isActive: boolean('is_active').notNull().default(true),
        deletedAt,
        createdAt,
    },
    (t) => [
        unique('project_looks_id_project_unique').on(t.id, t.projectId),
        index('project_looks_project_idx').on(t.projectId),
    ],
);

export const projectLookItems = pgTable(
    'project_look_items',
    {
        id,
        lookId: text('look_id').notNull(),
        projectId: text('project_id').notNull(),
        productId: text('product_id').notNull(),
        x: integer('x').notNull(),
        y: integer('y').notNull(),
        position: integer('position').notNull().default(0),
    },
    (t) => [
        foreignKey({
            columns: [t.lookId, t.projectId],
            foreignColumns: [projectLooks.id, projectLooks.projectId],
            name: 'project_look_items_look_project_fk',
        }).onDelete('cascade'),
        foreignKey({
            columns: [t.productId, t.projectId],
            foreignColumns: [products.id, products.projectId],
            name: 'project_look_items_product_project_fk',
        }).onDelete('cascade'),
        index('project_look_items_look_idx').on(t.lookId),
        check('project_look_items_x_range', sql`${t.x} between 0 and 100`),
        check('project_look_items_y_range', sql`${t.y} between 0 and 100`),
    ],
);

export type ProjectLookRecord = typeof projectLooks.$inferSelect;
export type ProjectLookItemRecord = typeof projectLookItems.$inferSelect;

export type LookItem = Pick<ProjectLookItemRecord, 'productId' | 'x' | 'y'>;

export type ProjectLookView = ProjectLookRecord & { items: LookItem[] };
