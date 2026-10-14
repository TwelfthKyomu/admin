import type { ComponentProps } from 'react';
import { cn } from '@/shared/lib/utils';
import {
    AUTO_ROWS_CLASS,
    COLUMNS_CLASS,
    FIXED_ROWS_CLASS,
    GAP_CLASS,
    GRID_CLASS,
    RATIO_CLASS,
    ROWS_CLASS,
} from './constants';

type WidgetGridGap = keyof typeof GAP_CLASS;

type WidgetGridRatio = keyof typeof RATIO_CLASS;

interface WidgetGridProps extends ComponentProps<'div'> {
    columns?: keyof typeof COLUMNS_CLASS;
    gap?: WidgetGridGap;
    ratio?: WidgetGridRatio;
    rows?: keyof typeof ROWS_CLASS;
    dense?: boolean;
}

export const WidgetGrid = ({
    columns = 4,
    gap = 'md',
    ratio,
    rows,
    dense = false,
    className,
    children,
    ...props
}: WidgetGridProps) => (
    <div
        className={cn(
            '@container',
            COLUMNS_CLASS[columns] ?? COLUMNS_CLASS[4],
            GAP_CLASS[gap],
            ratio && RATIO_CLASS[ratio],
            rows !== undefined && ROWS_CLASS[rows],
            className,
        )}
        {...props}
    >
        <div
            className={cn(
                GRID_CLASS,
                rows === undefined ? AUTO_ROWS_CLASS : FIXED_ROWS_CLASS,
                dense && 'grid-flow-row-dense',
            )}
        >
            {children}
        </div>
    </div>
);
