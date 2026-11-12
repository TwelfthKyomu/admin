import { type SQL, sql } from 'drizzle-orm';
import type { PgColumn } from 'drizzle-orm/pg-core';

export const positive = (column: PgColumn): SQL => {
    return sql`${column} > 0`;
};

export const nonNegative = (column: PgColumn): SQL => {
    return sql`${column} >= 0`;
};

export const nullOrPositive = (column: PgColumn): SQL => {
    return sql`${column} is null or ${column} > 0`;
};

export const nullOrNonNegative = (column: PgColumn): SQL => {
    return sql`${column} is null or ${column} >= 0`;
};
