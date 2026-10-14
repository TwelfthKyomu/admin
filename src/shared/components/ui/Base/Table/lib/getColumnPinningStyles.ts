import type { CSSProperties } from 'react';

export function getColumnPinningStyles(column: {
    getIsPinned: () => false | 'left' | 'right';
    getStart: (position?: 'left' | 'right' | 'center') => number;
    getAfter: (position?: 'left' | 'right' | 'center') => number;
}): CSSProperties {
    const isPinned = column.getIsPinned();

    if (!isPinned) return {};

    return {
        position: 'sticky',
        left: isPinned === 'left' ? column.getStart('left') : undefined,
        right: isPinned === 'right' ? column.getAfter('right') : undefined,
        backgroundColor: 'var(--background)',
        zIndex: 1,
    };
}
