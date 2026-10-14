import { env } from '@/env';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schemas';

function createConnectionPool(): Pool {
    return new Pool({
        connectionString: env.DATABASE_URL,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
        statement_timeout: 120000,
    });
}

const pool = createConnectionPool();

export const db = drizzle(pool, { schema });

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type Reader = Pick<typeof db, 'select'>;

pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client', err);
});
