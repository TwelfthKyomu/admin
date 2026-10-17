import { fileURLToPath } from 'node:url';
import type { StorybookConfig } from '@storybook/nextjs-vite';

const src = fileURLToPath(new URL('../src', import.meta.url));

const aliases = [
    { find: /^@\/ui\//, replacement: `${src}/shared/components/ui/` },
    { find: /^@\/layout\//, replacement: `${src}/shared/components/layout/` },
    {
        find: /^@\/feedback\//,
        replacement: `${src}/shared/components/feedback/`,
    },
    { find: /^@\//, replacement: `${src}/` },
];

const config: StorybookConfig = {
    stories: ['../src/**/*.stories.@(ts|tsx)'],
    addons: ['@storybook/addon-docs'],
    framework: {
        name: '@storybook/nextjs-vite',
        options: {},
    },
    staticDirs: ['../public'],
    async viteFinal(cfg) {
        cfg.resolve ??= {};
        const existing = cfg.resolve.alias;
        const existingArr = Array.isArray(existing)
            ? existing
            : existing
              ? Object.entries(existing).map(([find, replacement]) => ({
                    find,
                    replacement: replacement as string,
                }))
              : [];
        cfg.resolve.alias = [...existingArr, ...aliases];
        return cfg;
    },
};

export default config;
