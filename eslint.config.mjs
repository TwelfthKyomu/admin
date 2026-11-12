import stylistic from '@stylistic/eslint-plugin';
import tseslint from 'typescript-eslint';

const BLOCKS = ['if', 'for', 'while', 'do', 'switch', 'try'];
const DECLARATIONS = ['const', 'let', 'var'];

const NO_NULL_TERNARY = [
    {
        selector: "ConditionalExpression[consequent.raw='null'][alternate.type=/^JSX/]",
        message: 'Вместо `условие ? null : <…>` пишите `!условие && <…>`',
    },
    {
        selector: "ConditionalExpression[alternate.raw='null'][consequent.type=/^JSX/]",
        message: 'Вместо `условие ? <…> : null` пишите `условие && <…>`',
    },
];

const TOP = ['Program > VariableDeclaration', 'Program > ExportNamedDeclaration > VariableDeclaration'];
const COMPONENT_BODY = 'VariableDeclarator[id.name=/^[A-Z]/] > ArrowFunctionExpression > BlockStatement';
const HELPER = 'VariableDeclarator[id.name=/^(?!use[A-Z])[a-z]/][init.type=/Function/]';

const NO_FUNCTIONS_IN_COMPONENTS = TOP.map((top) => ({
    selector: `${top} > ${COMPONENT_BODY} > VariableDeclaration > VariableDeclarator[init.type=/Function/]`,
    message: 'Функции не объявлять в теле компонента: обработчики — в hooks/useX, расчёты — в lib/',
}));

const NO_HELPERS_IN_COMPONENT_FILES = TOP.map((top) => ({
    selector: `${top} > ${HELPER}`,
    message: 'Вспомогательные функции — в lib/ модуля, в файле компонента или хука только он сам',
}));

export default [
    {
        ignores: ['.next/**', 'node_modules/**', 'storybook-static/**', 'src/infrastructure/database/migrations/**'],
    },
    {
        files: ['src/**/*.{ts,tsx}'],
        languageOptions: { parser: tseslint.parser },
        plugins: { '@stylistic': stylistic },
        rules: {
            'no-nested-ternary': 'error',
            'func-style': ['error', 'expression'],
            'no-restricted-syntax': ['error', ...NO_NULL_TERNARY],
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
    {
        files: ['src/presentation/**/*.tsx', 'src/shared/components/**/*.tsx', 'src/**/hooks/*.ts', 'src/contexts/**/use*.ts'],
        ignores: ['**/lib/**', '**/primitives/**', '**/*.stories.tsx'],
        rules: {
            'no-restricted-syntax': [
                'error',
                ...NO_NULL_TERNARY,
                ...NO_FUNCTIONS_IN_COMPONENTS,
                ...NO_HELPERS_IN_COMPONENT_FILES,
            ],
        },
    },
];
