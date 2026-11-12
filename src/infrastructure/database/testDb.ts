import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import * as schema from './schemas';

export const createTestDb = async () => {
    const db = drizzle(new PGlite(), { schema });

    await migrate(db, {
        migrationsFolder: `${import.meta.dirname}/migrations`,
    });

    return db;
};
