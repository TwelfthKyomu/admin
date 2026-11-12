'use client';

'use no memo';

import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
    Select,
} from '@/ui/Base';
import { useTablePagination } from '../../hooks/useTablePagination';

interface TablePaginationProps {
    pageSizeOptions?: number[];
    siblingCount?: number;
    selectionActions?: ReactNode;
}

export const TablePagination = ({
    pageSizeOptions = [10, 25, 50, 100],
    siblingCount = 1,
    selectionActions,
}: TablePaginationProps) => {
    const pagination = useTablePagination(pageSizeOptions, siblingCount);

    return (
        <div className="flex flex-col-reverse items-stretch gap-3 px-2 py-3 sm:flex-row sm:items-center justify-between">
            <div className="flex min-h-8 flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>
                    {pagination.selected > 0
                        ? `Выбрано ${pagination.selected} из ${pagination.total}`
                        : `Показано ${pagination.from}–${pagination.to} из ${pagination.total}`}
                </span>
                {pagination.selected > 0 && selectionActions}
            </div>

            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">На странице</span>
                    <Select
                        options={pagination.pageSizeItems}
                        value={String(pagination.pageSize)}
                        onValueChange={pagination.setPageSize}
                        triggerClassName="h-8 w-18"
                    />
                </div>

                <Pagination className="mx-0 w-auto justify-end">
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious
                                href="#"
                                aria-disabled={!pagination.canPrevious}
                                data-disabled={!pagination.canPrevious || undefined}
                                className={cn(
                                    !pagination.canPrevious && 'pointer-events-none opacity-50',
                                )}
                                onClick={pagination.goPrevious}
                            />
                        </PaginationItem>

                        {pagination.range.map((item, index) =>
                            typeof item === 'number' ? (
                                <PaginationItem key={`page-${item}`}>
                                    <PaginationLink
                                        href="#"
                                        isActive={item === pagination.currentPage}
                                        onClick={(event) => pagination.goTo(event, item)}
                                    >
                                        {item}
                                    </PaginationLink>
                                </PaginationItem>
                            ) : (
                                <PaginationItem key={`${item}-${index}`}>
                                    <PaginationEllipsis />
                                </PaginationItem>
                            ),
                        )}

                        <PaginationItem>
                            <PaginationNext
                                href="#"
                                aria-disabled={!pagination.canNext}
                                data-disabled={!pagination.canNext || undefined}
                                className={cn(
                                    !pagination.canNext && 'pointer-events-none opacity-50',
                                )}
                                onClick={pagination.goNext}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            </div>
        </div>
    );
};
