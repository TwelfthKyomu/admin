'use client';

'use no memo';

import { Fragment, type ReactElement, type ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';
import { useDataTable } from '@/ui/Base/Table/context';
import { getColumnPinningStyles } from '@/ui/Base/Table/lib/getColumnPinningStyles';
import { TableBody as BaseTableBody, TableCell, TableRow } from '@/ui/Base/Table/primitives';
import { flexRender, type Row } from '@tanstack/react-table';

interface TableBodyProps<TData> {
    bodyClassName?: string;
    cellClassName?: string;
    rowClassName?: string | ((row: Row<TData>) => string);
    highlightOnHover?: boolean;
    stripedRows?: boolean;
    onRowClick?: (row: Row<TData>) => void;
    onRowDoubleClick?: (row: Row<TData>) => void;
    emptyMessage?: ReactNode;
    enableExpanding?: boolean;
    renderSubComponent?: (props: { row: Row<TData> }) => ReactElement;
}

export const TableBody = <TData,>({
    bodyClassName,
    cellClassName,
    rowClassName,
    highlightOnHover = true,
    stripedRows,
    onRowClick,
    onRowDoubleClick,
    emptyMessage = 'Нет результата.',
    enableExpanding,
    renderSubComponent,
}: TableBodyProps<TData>) => {
    const table = useDataTable<TData>();
    const rows = table.getRowModel().rows;

    const buildRowClass = (row: Row<TData>) => {
        const base = cn(
            highlightOnHover && 'hover:bg-muted/50',
            stripedRows && 'even:bg-muted/30',
            row.getIsSelected() && 'bg-muted',
            (onRowClick || onRowDoubleClick) && 'cursor-pointer',
        );

        const custom = typeof rowClassName === 'function' ? rowClassName(row) : rowClassName;

        return cn(base, custom);
    };

    if (rows.length === 0) {
        return (
            <BaseTableBody className={bodyClassName}>
                <TableRow>
                    <TableCell
                        colSpan={table.getAllColumns().length}
                        className="h-24 text-center text-muted-foreground"
                    >
                        {emptyMessage}
                    </TableCell>
                </TableRow>
            </BaseTableBody>
        );
    }

    return (
        <BaseTableBody className={bodyClassName}>
            {rows.map((row) => (
                <Fragment key={row.id}>
                    <TableRow
                        data-state={row.getIsSelected() ? 'selected' : undefined}
                        className={buildRowClass(row)}
                        onClick={() => onRowClick?.(row)}
                        onDoubleClick={() => onRowDoubleClick?.(row)}
                    >
                        {row.getVisibleCells().map((cell) => (
                            <TableCell
                                key={cell.id}
                                className={cellClassName}
                                style={{
                                    width: cell.column.getSize(),
                                    ...getColumnPinningStyles(cell.column),
                                }}
                            >
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                        ))}
                    </TableRow>
                    {enableExpanding && row.getIsExpanded() && renderSubComponent && (
                        <TableRow>
                            <TableCell colSpan={row.getVisibleCells().length}>
                                {renderSubComponent({
                                    row,
                                })}
                            </TableCell>
                        </TableRow>
                    )}
                </Fragment>
            ))}
        </BaseTableBody>
    );
};
