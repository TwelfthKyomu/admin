import { type SQL, sql } from 'drizzle-orm';
import type { PgColumn } from 'drizzle-orm/pg-core';

export function positive(column: PgColumn): SQL {
    return sql`${column} > 0`;
}

export function nonNegative(column: PgColumn): SQL {
    return sql`${column} >= 0`;
}

export function nullOrPositive(column: PgColumn): SQL {
    return sql`${column} is null or ${column} > 0`;
}

export function nullOrNonNegative(column: PgColumn): SQL {
    return sql`${column} is null or ${column} >= 0`;
}
