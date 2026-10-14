import { id, staticTimestamps } from '@/infrastructure/database/columns';
import {
    boolean,
    index,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
    varchar,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
    id,
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    emailVerified: boolean('email_verified').notNull().default(false),
    image: text('image'),
    ...staticTimestamps,
});

export const accounts = pgTable(
    'accounts',
    {
        id,
        userId: text('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        accountId: text('account_id').notNull(),
        providerId: text('provider_id').notNull(),
        accessToken: text('access_token'),
        refreshToken: text('refresh_token'),
        accessTokenExpiresAt: timestamp('access_token_expires_at', {
            precision: 6,
            withTimezone: true,
        }),
        refreshTokenExpiresAt: timestamp('refresh_token_expires_at', {
            precision: 6,
            withTimezone: true,
        }),
        scope: text('scope'),
        idToken: text('id_token'),
        password: text('password'),
        createdAt: timestamp('created_at').notNull(),
        updatedAt: timestamp('updated_at').notNull().defaultNow(),
    },
    (t) => [
        uniqueIndex('uq_accounts_provider_account').on(
            t.providerId,
            t.accountId,
        ),
        index('idx_accounts_user_id').on(t.userId),
    ],
);

export const sessions = pgTable(
    'sessions',
    {
        id,
        userId: text('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        token: varchar('token', { length: 255 }).notNull().unique(),
        expiresAt: timestamp('expires_at').notNull(),
        ipAddress: text('ip_address'),
        userAgent: text('user_agent'),
        ...staticTimestamps,
    },
    (t) => [
        index('idx_sessions_user_id').on(t.userId),
        index('idx_sessions_expires_at').on(t.expiresAt),
    ],
);

export const verifications = pgTable(
    'verifications',
    {
        id,
        identifier: text('identifier').notNull(),
        value: text('value').notNull(),
        expiresAt: timestamp('expires_at').notNull(),
        createdAt: timestamp('created_at').notNull(),
        updatedAt: timestamp('updated_at').notNull(),
    },
    (t) => [
        uniqueIndex('uq_verifications_identifier_value').on(
            t.identifier,
            t.value,
        ),
        index('idx_verifications_expires_at').on(t.expiresAt),
    ],
);

export type UserRecord = typeof users.$inferSelect;
