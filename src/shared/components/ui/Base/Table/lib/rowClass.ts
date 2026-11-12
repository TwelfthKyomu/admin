import { cn } from '@/shared/lib/utils';
import type { Row } from '@tanstack/react-table';

interface RowClassOptions<TData> {
    highlightOnHover?: boolean;
    stripedRows?: boolean;
    clickable: boolean;
    rowClassName?: string | ((row: Row<TData>) => string);
}

export const rowClass = <TData>(
    row: Row<TData>,
    {
        highlightOnHover,
        stripedRows,
        clickable,
        rowClassName,
    }: RowClassOptions<TData>,
): string => {
    const custom =
        typeof rowClassName === 'function' ? rowClassName(row) : rowClassName;

    return cn(
        highlightOnHover && 'hover:bg-muted/50',
        stripedRows && 'even:bg-muted/30',
        row.getIsSelected() && 'bg-muted',
        clickable && 'cursor-pointer',
        custom,
    );
};
