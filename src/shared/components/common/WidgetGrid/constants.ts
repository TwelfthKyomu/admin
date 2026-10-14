export const COLUMNS_CLASS: Record<number, string> = {
    1: '[--wg-cols:1]',
    2: '[--wg-cols:2]',
    3: '[--wg-cols:3]',
    4: '[--wg-cols:4]',
    5: '[--wg-cols:5]',
    6: '[--wg-cols:6]',
    8: '[--wg-cols:8]',
};

export const GAP_CLASS = {
    none: '[--wg-gap:0px]',
    xs: '[--wg-gap:0.25rem]',
    sm: '[--wg-gap:0.5rem]',
    md: '[--wg-gap:0.75rem]',
    lg: '[--wg-gap:1rem]',
} as const;

export const RATIO_CLASS = {
    square: '[--wg-ratio:1]',
    wide: '[--wg-ratio:0.75]',
    flat: '[--wg-ratio:0.6]',
    slim: '[--wg-ratio:0.45]',
} as const;

export const ROWS_CLASS: Record<number, string> = {
    1: '[--wg-rows:1]',
    2: '[--wg-rows:2]',
    3: '[--wg-rows:3]',
    4: '[--wg-rows:4]',
};

export const GRID_CLASS = [
    'grid [gap:var(--wg-gap)]',
    '[--wg-radius:clamp(0.375rem,calc(var(--wg-cell)*0.1),1rem)]',
    '[grid-template-columns:repeat(var(--wg-cols),minmax(0,1fr))]',
] as const;

export const AUTO_ROWS_CLASS =
    '[grid-auto-rows:calc(var(--wg-cell)*var(--wg-ratio,1))]';

export const FIXED_ROWS_CLASS =
    'h-full [grid-template-rows:repeat(var(--wg-rows),minmax(0,1fr))]';
