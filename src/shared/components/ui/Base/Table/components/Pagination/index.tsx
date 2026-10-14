'use client';

'use no memo';

import type { ReactNode } from 'react';
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
import { useDataTable } from '@/ui/Base/Table/context';

interface TablePaginationProps {
    pageSizeOptions?: number[];
    siblingCount?: number;
    selectionActions?: ReactNode;
}

function buildPageRange(
    current: number,
    total: number,
    siblings: number,
): Array<number | 'left-ellipsis' | 'right-ellipsis'> {
    if (total <= siblings + 4) {
        return Array.from({ length: total }, (_, index) => index + 1);
    }

    const left = Math.max(2, current - siblings);
    const right = Math.min(total - 1, current + siblings);
    const showLeftDots = left > 2;
    const showRightDots = right < total - 1;

    const range: Array<number | 'left-ellipsis' | 'right-ellipsis'> = [1];

    if (showLeftDots) range.push('left-ellipsis');

    for (let page = left; page <= right; page += 1) range.push(page);

    if (showRightDots) range.push('right-ellipsis');

    range.push(total);

    return range;
}

export const TablePagination = ({
    pageSizeOptions = [10, 25, 50, 100],
    siblingCount = 1,
    selectionActions,
}: TablePaginationProps) => {
    const table = useDataTable();

    const pageIndex = table.getState().pagination.pageIndex;
    const pageSize = table.getState().pagination.pageSize;
    const pageCount = table.getPageCount();
    const total = table.getFilteredRowModel().rows.length;
    const selected = table.getFilteredSelectedRowModel().rows.length;

    const from = total === 0 ? 0 : pageIndex * pageSize + 1;
    const to = Math.min(total, (pageIndex + 1) * pageSize);
    const currentPage = pageCount === 0 ? 0 : pageIndex + 1;

    const range = pageCount > 0 ? buildPageRange(currentPage, pageCount, siblingCount) : [];

    const goTo = (page: number) => {
        const safe = Math.min(Math.max(1, page), pageCount);

        table.setPageIndex(safe - 1);
    };

    const pageSizeOptionsFormatted = pageSizeOptions.map((value) => ({
        value: String(value),
        label: String(value),
    }));

    return (
        <div className="flex flex-col-reverse items-stretch gap-3 px-2 py-3 sm:flex-row sm:items-center justify-between">
            <div className="flex min-h-8 flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>
                    {selected > 0
                        ? `Выбрано ${selected} из ${total}`
                        : `Показано ${from}–${to} из ${total}`}
                </span>
                {selected > 0 && selectionActions}
            </div>

            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">На странице</span>
                    <Select
                        options={pageSizeOptionsFormatted}
                        value={String(pageSize)}
                        onValueChange={(value) => table.setPageSize(Number(value))}
                        triggerClassName="h-8 w-18"
                    />
                </div>

                <Pagination className="mx-0 w-auto justify-end">
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious
                                href="#"
                                aria-disabled={!table.getCanPreviousPage()}
                                data-disabled={!table.getCanPreviousPage() || undefined}
                                className={
                                    !table.getCanPreviousPage()
                                        ? 'pointer-events-none opacity-50'
                                        : undefined
                                }
                                onClick={(event) => {
                                    event.preventDefault();

                                    if (table.getCanPreviousPage()) table.previousPage();
                                }}
                            />
                        </PaginationItem>

                        {range.map((item, index) =>
                            typeof item === 'number' ? (
                                <PaginationItem key={`page-${item}`}>
                                    <PaginationLink
                                        href="#"
                                        isActive={item === currentPage}
                                        onClick={(event) => {
                                            event.preventDefault();
                                            goTo(item);
                                        }}
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
                                aria-disabled={!table.getCanNextPage()}
                                data-disabled={!table.getCanNextPage() || undefined}
                                className={
                                    !table.getCanNextPage()
                                        ? 'pointer-events-none opacity-50'
                                        : undefined
                                }
                                onClick={(event) => {
                                    event.preventDefault();

                                    if (table.getCanNextPage()) table.nextPage();
                                }}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            </div>
        </div>
    );
};
