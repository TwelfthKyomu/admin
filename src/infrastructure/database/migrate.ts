import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnvConfig } from '@next/env';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

loadEnvConfig(process.cwd());

const connectionString =
    process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error(
        'DATABASE_URL (или MIGRATION_DATABASE_URL) обязателен для миграций',
    );
}

const migrationsFolder = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    'migrations',
);

async function main(): Promise<void> {
    const pool = new Pool({ connectionString, max: 1 });

    try {
        const db = drizzle(pool);

        await migrate(db, { migrationsFolder });
        process.stdout.write('✓ Миграции применены\n');
    } finally {
        await pool.end();
    }
}

main().catch((error) => {
    console.error('✗ Ошибка миграции:', error);
    process.exit(1);
});
