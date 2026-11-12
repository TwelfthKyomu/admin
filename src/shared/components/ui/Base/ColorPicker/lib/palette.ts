export const FALLBACK_COLOR = '#737373';

export const COLOR_PRESETS = [
    '#64748b',
    '#ef4444',
    '#f97316',
    '#f59e0b',
    '#eab308',
    '#84cc16',
    '#22c55e',
    '#10b981',
    '#14b8a6',
    '#06b6d4',
    '#0ea5e9',
    '#3b82f6',
    '#6366f1',
    '#8b5cf6',
    '#a855f7',
    '#ec4899',
];

export const isSameColor = (left: string, right: string): boolean =>
    left.toLowerCase() === right.toLowerCase();
