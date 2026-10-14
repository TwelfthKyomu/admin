'use client';

'use no memo';

import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';
import { Button, Popover } from '@/ui/Base';
import { useDataTable } from '@/ui/Base/Table/context';
import { getColumnPinningStyles } from '@/ui/Base/Table/lib/getColumnPinningStyles';
import { TableHeader as BaseTableHeader, TableHead, TableRow } from '@/ui/Base/Table/primitives';
import { flexRender } from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ChevronsUpDown, EllipsisVerticalIcon } from 'lucide-react';

interface TableHeaderProps {
    stickyHeader?: boolean;
    className?: string;
    roundedHeader?: boolean;
    headerAction?: ReactNode;
}

export const TableHeader = ({ stickyHeader, className, headerAction }: TableHeaderProps) => {
    const table = useDataTable();

    return (
        <BaseTableHeader className={cn(stickyHeader && 'sticky top-0 z-10', className)}>
            {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                    key={headerGroup.id}
                    className="bg-secondary"
                >
                    {headerGroup.headers.map((header) => {
                        const canSort = header.column.getCanSort();
                        const sorted = header.column.getIsSorted();

                        return (
                            <TableHead
                                key={header.id}
                                colSpan={header.colSpan}
                                style={{
                                    width: header.getSize(),
                                    ...getColumnPinningStyles(header.column),
                                }}
                                className={cn('cursor-pointer select-none not-last:border-r')}
                                onClick={
                                    canSort ? header.column.getToggleSortingHandler() : undefined
                                }
                            >
                                {header.isPlaceholder ? null : (
                                    <span className="flex items-center gap-1.5">
                                        {flexRender(
                                            header.column.columnDef.header,
                                            header.getContext(),
                                        )}
                                        {canSort && <SortIndicator state={sorted} />}
                                        {headerAction && (
                                            <Popover
                                                className="ml-auto"
                                                trigger={
                                                    <Button
                                                        className="ml-auto"
                                                        variant="outline"
                                                        size="icon-xs"
                                                    >
                                                        <EllipsisVerticalIcon />
                                                    </Button>
                                                }
                                            >
                                                {headerAction}
                                            </Popover>
                                        )}
                                    </span>
                                )}
                            </TableHead>
                        );
                    })}
                </TableRow>
            ))}
        </BaseTableHeader>
    );
};

const SortIndicator = ({ state }: { state: 'asc' | 'desc' | false }) => {
    const className = 'size-3.5 text-muted-foreground';

    if (state === 'asc') return <ArrowUp className={className} />;
    if (state === 'desc') return <ArrowDown className={className} />;

    return <ChevronsUpDown className={cn(className, 'opacity-40')} />;
};
