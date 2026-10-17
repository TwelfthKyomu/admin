import stylistic from '@stylistic/eslint-plugin';
import tseslint from 'typescript-eslint';

const BLOCKS = ['if', 'for', 'while', 'do', 'switch', 'try'];
const DECLARATIONS = ['const', 'let', 'var'];

export default [
    {
        ignores: ['.next/**', 'node_modules/**', 'storybook-static/**', 'src/infrastructure/database/migrations/**'],
    },
    {
        files: ['src/**/*.{ts,tsx}'],
        languageOptions: { parser: tseslint.parser },
        plugins: { '@stylistic': stylistic },
        rules: {
            '@stylistic/padding-line-between-statements': [
                'error',
                { blankLine: 'always', prev: 'directive', next: '*' },
                { blankLine: 'always', prev: 'import', next: '*' },
                { blankLine: 'any', prev: 'import', next: 'import' },
                { blankLine: 'always', prev: DECLARATIONS, next: '*' },
                { blankLine: 'any', prev: DECLARATIONS, next: DECLARATIONS },
                { blankLine: 'always', prev: ['multiline-const', 'multiline-let'], next: '*' },
                { blankLine: 'always', prev: '*', next: ['multiline-const', 'multiline-let'] },
                { blankLine: 'always', prev: '*', next: BLOCKS },
                { blankLine: 'always', prev: BLOCKS, next: '*' },
                { blankLine: 'any', prev: 'if', next: 'if' },
                { blankLine: 'always', prev: 'multiline-expression', next: '*' },
                { blankLine: 'always', prev: '*', next: 'multiline-expression' },
                { blankLine: 'always', prev: '*', next: ['function', 'class', 'interface', 'type'] },
                { blankLine: 'always', prev: ['function', 'class', 'interface', 'type'], next: '*' },
                { blankLine: 'always', prev: '*', next: 'return' },
            ],
        },
    },
];
