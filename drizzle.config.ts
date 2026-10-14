import { loadEnvConfig } from '@next/env';
import { defineConfig } from 'drizzle-kit';

loadEnvConfig(process.cwd());

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required for Drizzle config');
}

export default defineConfig({
    schema: './src/infrastructure/database/schemas',
    out: './src/infrastructure/database/migrations',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL,
    },
});
