import { createdAt, id } from '@/infrastructure/database/columns';
import { projects } from '@/contexts/project/Projects.table';
import { sql } from 'drizzle-orm';
import {
    bigint,
    check,
    index,
    integer,
    pgTable,
    text,
    timestamp,
    unique,
    uniqueIndex,
    varchar,
} from 'drizzle-orm/pg-core';

export const clients = pgTable(
    'clients',
    {
        id,
        projectId: text('project_id')
            .notNull()
            .references(() => projects.id, { onDelete: 'cascade' }),
        email: varchar('email', { length: 320 }),
        phone: varchar('phone', { length: 32 }),
        firstName: varchar('first_name', { length: 100 }).notNull(),
        lastName: varchar('last_name', { length: 100 }),
        middleName: varchar('middle_name', { length: 100 }),
        totalOrders: integer('total_orders').notNull().default(0),
        totalSpentAmount: bigint('total_spent_amount', { mode: 'number' })
            .notNull()
            .default(0),
        lastVisitAt: timestamp('last_visit_at'),
        passwordHash: text('password_hash'),
        emailVerifiedAt: timestamp('email_verified_at'),
        verificationCodeHash: text('verification_code_hash'),
        verificationCodeExpiresAt: timestamp('verification_code_expires_at'),
        createdAt,
    },
    (t) => [
        uniqueIndex('clients_project_email_unique').on(t.projectId, t.email),
        index('clients_project_idx').on(t.projectId),

        unique('clients_id_project_unique').on(t.id, t.projectId),
        check(
            'clients_contact_present',
            sql`${t.email} is not null or ${t.phone} is not null`,
        ),
    ],
);

export type ClientRecord = typeof clients.$inferSelect;
export type NewClientRecord = typeof clients.$inferInsert;

export type ClientView = Omit<
    ClientRecord,
    'passwordHash' | 'verificationCodeHash' | 'verificationCodeExpiresAt'
>;
