'use client';

'use no memo';

import { cn } from '@/shared/lib/utils';
import type { Table } from '@tanstack/react-table';
import { DataTableContext } from '../../context';
import { Table as BaseTable, TableBody, TableCell, TableRow } from '../../primitives';
import { TableHeader } from '../TableHeader';

interface TableSkeletonProps<TData> {
    table: Table<TData>;
    rows: number;
    stickyHeader?: boolean;
    className?: string;
    tableClassName?: string;
    headerClassName?: string;
    bodyClassName?: string;
    cellClassName?: string;
}

export const TableSkeleton = <TData,>({
    table,
    rows,
    stickyHeader,
    className,
    tableClassName,
    headerClassName,
    bodyClassName,
    cellClassName,
}: TableSkeletonProps<TData>) => (
    <div className={cn('overflow-hidden rounded-md border', className)}>
        <BaseTable className={tableClassName}>
            <DataTableContext.Provider value={table}>
                <TableHeader
                    stickyHeader={stickyHeader}
                    className={headerClassName}
                />
            </DataTableContext.Provider>
            <TableBody className={bodyClassName}>
                {Array.from({ length: rows }).map((_, index) => (
                    <TableRow key={index}>
                        {table.getAllColumns().map((column) => (
                            <TableCell
                                key={column.id}
                                className={cellClassName}
                            >
                                <div className="h-4 w-full animate-pulse rounded bg-muted" />
                            </TableCell>
                        ))}
                    </TableRow>
                ))}
            </TableBody>
        </BaseTable>
    </div>
);
