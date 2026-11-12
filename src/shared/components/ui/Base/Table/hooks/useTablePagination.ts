'use no memo';

import type { MouseEvent } from 'react';
import { useDataTable } from '@/ui/Base/Table/context';
import { buildPageRange } from '../lib/pageRange';

export const useTablePagination = (
    pageSizeOptions: number[],
    siblingCount: number,
) => {
    const table = useDataTable();

    const pageIndex = table.getState().pagination.pageIndex;
    const pageSize = table.getState().pagination.pageSize;
    const pageCount = table.getPageCount();
    const total = table.getFilteredRowModel().rows.length;
    const selected = table.getFilteredSelectedRowModel().rows.length;
    const currentPage = pageCount === 0 ? 0 : pageIndex + 1;

    const goTo = (event: MouseEvent, page: number) => {
        event.preventDefault();
        table.setPageIndex(Math.min(Math.max(1, page), pageCount) - 1);
    };

    const goPrevious = (event: MouseEvent) => {
        event.preventDefault();

        if (table.getCanPreviousPage()) table.previousPage();
    };

    const goNext = (event: MouseEvent) => {
        event.preventDefault();

        if (table.getCanNextPage()) table.nextPage();
    };

    return {
        total,
        selected,
        from: total === 0 ? 0 : pageIndex * pageSize + 1,
        to: Math.min(total, (pageIndex + 1) * pageSize),
        currentPage,
        pageSize,
        range:
            pageCount > 0
                ? buildPageRange(currentPage, pageCount, siblingCount)
                : [],
        canPrevious: table.getCanPreviousPage(),
        canNext: table.getCanNextPage(),
        pageSizeItems: pageSizeOptions.map((value) => ({
            value: String(value),
            label: String(value),
        })),
        setPageSize: (value: string) => table.setPageSize(Number(value)),
        goTo,
        goPrevious,
        goNext,
    };
};
