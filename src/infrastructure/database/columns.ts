import { sql } from 'drizzle-orm';
import { text, timestamp } from 'drizzle-orm/pg-core';

export const id = text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

export const deletedAt = timestamp('deleted_at');

export const createdAt = timestamp('created_at').notNull().defaultNow();

export const staticTimestamps = {
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
};

export function textArray(name: string) {
    return text(name).array().notNull().default(sql`'{}'::text[]`);
}
