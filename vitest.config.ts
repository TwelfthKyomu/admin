import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const src = fileURLToPath(new URL('./src', import.meta.url));
const serverOnlyStub = fileURLToPath(
    new URL('./node_modules/server-only/empty.js', import.meta.url),
);

export default defineConfig({
    resolve: {
        alias: [
            { find: /^server-only$/, replacement: serverOnlyStub },
            { find: /^@\/ui\//, replacement: `${src}/shared/components/ui/` },
            {
                find: /^@\/layout\//,
                replacement: `${src}/shared/components/layout/`,
            },
            {
                find: /^@\/feedback\//,
                replacement: `${src}/shared/components/feedback/`,
            },
            { find: /^@\//, replacement: `${src}/` },
        ],
    },
    test: {
        environment: 'node',
        include: ['src/**/*.{test,spec}.ts'],
        env: {
            SKIP_ENV_VALIDATION: '1',
            DATABASE_URL: 'postgres://test:test@localhost:5432/test',
            AUTH_SECRET: 'test_dummy_auth_secret_0123456789ab',
            ENCRYPTION_KEY: '0123456789abcdef0123456789abcdef',
        },
    },
});
