'use client';

'use no memo';

import {
    type ReactElement,
    type ReactNode,
    type RefObject,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { cn } from '@/shared/lib/utils';
import { TableBody, TableFooter, TableHeader, TablePagination, TableToolbar } from '@/ui/Base';
import {
    type ColumnDef,
    type ColumnFiltersState,
    type ColumnOrderState,
    type ColumnPinningState,
    type ExpandedState,
    type GroupingState,
    getCoreRowModel,
    getExpandedRowModel,
    getFacetedMinMaxValues,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFilteredRowModel,
    getGroupedRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    type PaginationState,
    type Row,
    type RowSelectionState,
    type SortingState,
    type Table as TanstackTable,
    type Updater,
    useReactTable,
    type VisibilityState,
} from '@tanstack/react-table';
import { RotateCcw, TriangleAlert } from 'lucide-react';
import { Button } from '../Button';
import { DataTableContext } from './context';
import { resolveTableColumns } from './lib/columns';
import {
    Table as BaseTable,
    TableBody as BaseTableBody,
    TableCaption,
    TableCell,
    TableRow,
} from './primitives';

export interface DataTableProps<TData> {
    columns: ColumnDef<TData, any>[];
    data: TData[];
    enableSorting?: boolean;
    enableMultiSort?: boolean;
    manualSorting?: boolean;
    onSortingChange?: (sorting: SortingState) => void;
    initialSorting?: SortingState;
    enableFiltering?: boolean;
    enableGlobalFilter?: boolean;
    manualFiltering?: boolean;
    onColumnFiltersChange?: (filters: ColumnFiltersState) => void;
    onGlobalFilterChange?: (value: string) => void;
    initialColumnFilters?: ColumnFiltersState;
    globalFilter?: string;
    enablePagination?: boolean;
    manualPagination?: boolean;
    pageCount?: number;
    onPaginationChange?: (pagination: PaginationState) => void;
    initialPagination?: PaginationState;
    pageSizeOptions?: number[];
    enableRowSelection?: boolean | ((row: Row<TData>) => boolean);
    enableMultiRowSelection?: boolean;
    onRowSelectionChange?: (selection: RowSelectionState) => void;
    initialRowSelection?: RowSelectionState;
    enableColumnVisibility?: boolean;
    onColumnVisibilityChange?: (visibility: VisibilityState) => void;
    initialColumnVisibility?: VisibilityState;
    enableColumnOrdering?: boolean;
    onColumnOrderChange?: (order: ColumnOrderState) => void;
    initialColumnOrder?: ColumnOrderState;
    enableColumnPinning?: boolean;
    onColumnPinningChange?: (pinning: ColumnPinningState) => void;
    initialColumnPinning?: ColumnPinningState;
    enableExpanding?: boolean;
    onExpandedChange?: (expanded: ExpandedState) => void;
    initialExpanded?: ExpandedState;
    getSubRows?: (row: TData) => TData[] | undefined;
    renderSubComponent?: (props: { row: Row<TData> }) => ReactElement;
    enableGrouping?: boolean;
    onGroupingChange?: (grouping: GroupingState) => void;
    initialGrouping?: GroupingState;
    enableFaceting?: boolean;
    className?: string;
    tableClassName?: string;
    headerClassName?: string;
    bodyClassName?: string;
    rowClassName?: string | ((row: Row<TData>) => string);
    cellClassName?: string;
    isLoading?: boolean;
    loadingRows?: number;
    emptyMessage?: ReactNode;
    isError?: boolean;
    errorMessage?: ReactNode;
    onRetry?: () => void;
    stickyHeader?: boolean;
    stripedRows?: boolean;
    highlightOnHover?: boolean;
    showFooter?: boolean;
    showToolbar?: boolean;
    toolbarPlaceholder?: string;
    toolbarActions?: ReactNode;
    bulkActions?: (selectedRows: TData[]) => ReactNode;
    caption?: ReactNode;
    getRowId?: (row: TData) => string;
    onRowClick?: (row: Row<TData>) => void;
    onRowDoubleClick?: (row: Row<TData>) => void;
    tableRef?: RefObject<TanstackTable<TData> | null>;
    customActions?: ReactNode;
}

function useNotifiedState<T>(initial: T, notify?: (next: T) => void) {
    const [state, setState] = useState<T>(initial);

    const onChange = (updater: Updater<T>) => {
        const next = typeof updater === 'function' ? (updater as (old: T) => T)(state) : updater;

        setState(next);
        notify?.(next);
    };

    return [state, onChange, setState] as const;
}

export const Table = <TData,>({
    columns,
    data,
    enableSorting = true,
    enableMultiSort = false,
    manualSorting = false,
    onSortingChange,
    initialSorting = [],
    enableFiltering = true,
    enableGlobalFilter = true,
    manualFiltering = false,
    onColumnFiltersChange,
    onGlobalFilterChange,
    initialColumnFilters = [],
    globalFilter: globalFilterProp,
    enablePagination = true,
    manualPagination = false,
    pageCount,
    onPaginationChange,
    initialPagination = { pageIndex: 0, pageSize: 10 },
    pageSizeOptions,
    enableRowSelection = false,
    enableMultiRowSelection = true,
    onRowSelectionChange,
    initialRowSelection = {},
    enableColumnVisibility = true,
    onColumnVisibilityChange,
    initialColumnVisibility = {},
    enableColumnOrdering = false,
    onColumnOrderChange,
    initialColumnOrder = [],
    enableColumnPinning = false,
    onColumnPinningChange,
    initialColumnPinning = {},
    enableExpanding = false,
    onExpandedChange,
    initialExpanded = {},
    getSubRows,
    renderSubComponent,
    enableGrouping = false,
    onGroupingChange,
    initialGrouping = [],
    enableFaceting = false,
    className,
    tableClassName,
    headerClassName,
    bodyClassName,
    rowClassName,
    cellClassName,
    isLoading = false,
    loadingRows = 5,
    emptyMessage = 'Нет результата.',
    isError = false,
    errorMessage = 'Не удалось загрузить данные.',
    onRetry,
    stickyHeader = false,
    stripedRows = false,
    highlightOnHover = true,
    showFooter = false,
    showToolbar = false,
    toolbarPlaceholder,
    toolbarActions,
    bulkActions,
    caption,
    getRowId,
    onRowClick,
    onRowDoubleClick,
    tableRef,
    customActions,
}: DataTableProps<TData>) => {
    const [sorting, handleSortingChange] = useNotifiedState<SortingState>(
        initialSorting,
        onSortingChange,
    );

    const [columnFilters, handleColumnFiltersChange] = useNotifiedState<ColumnFiltersState>(
        initialColumnFilters,
        onColumnFiltersChange,
    );

    const [globalFilter, handleGlobalFilterChange, setGlobalFilter] = useNotifiedState<string>(
        globalFilterProp ?? '',
        onGlobalFilterChange,
    );

    const [pagination, handlePaginationChange] = useNotifiedState<PaginationState>(
        initialPagination,
        onPaginationChange,
    );

    const [rowSelection, handleRowSelectionChange] = useNotifiedState<RowSelectionState>(
        initialRowSelection,
        onRowSelectionChange,
    );

    const [columnVisibility, handleColumnVisibilityChange] = useNotifiedState<VisibilityState>(
        initialColumnVisibility,
        onColumnVisibilityChange,
    );

    const [columnOrder, handleColumnOrderChange] = useNotifiedState<ColumnOrderState>(
        initialColumnOrder,
        onColumnOrderChange,
    );

    const [columnPinning, handleColumnPinningChange] = useNotifiedState<ColumnPinningState>(
        initialColumnPinning,
        onColumnPinningChange,
    );

    const [expanded, handleExpandedChange] = useNotifiedState<ExpandedState>(
        initialExpanded,
        onExpandedChange,
    );

    const [grouping, handleGroupingChange] = useNotifiedState<GroupingState>(
        initialGrouping,
        onGroupingChange,
    );

    useEffect(() => {
        if (globalFilterProp !== undefined) setGlobalFilter(globalFilterProp);
    }, [globalFilterProp]);

    const resolvedColumns = useMemo(
        () => resolveTableColumns(columns, enableRowSelection),
        [columns, enableRowSelection],
    );

    const table = useReactTable({
        data,
        columns: resolvedColumns,
        state: {
            sorting,
            columnFilters,
            globalFilter,
            pagination,
            rowSelection,
            columnVisibility,
            columnOrder: enableColumnOrdering ? columnOrder : [],
            columnPinning,
            expanded,
            grouping,
        },
        getCoreRowModel: getCoreRowModel(),
        ...(enableSorting && {
            getSortedRowModel: getSortedRowModel(),
        }),
        ...(enableFiltering && {
            getFilteredRowModel: getFilteredRowModel(),
        }),
        ...(enablePagination &&
            !manualPagination && {
                getPaginationRowModel: getPaginationRowModel(),
            }),
        ...(enableExpanding && {
            getExpandedRowModel: getExpandedRowModel(),
        }),
        ...(enableGrouping && {
            getGroupedRowModel: getGroupedRowModel(),
        }),
        ...(enableFaceting && {
            getFacetedRowModel: getFacetedRowModel<TData>(),
            getFacetedUniqueValues: getFacetedUniqueValues<TData>(),
            getFacetedMinMaxValues: getFacetedMinMaxValues<TData>(),
        }),
        enableSorting,
        enableMultiSort,
        enableHiding: enableColumnVisibility,
        manualSorting,
        onSortingChange: handleSortingChange,
        enableFilters: enableFiltering,
        enableGlobalFilter,
        manualFiltering,
        onColumnFiltersChange: handleColumnFiltersChange,
        onGlobalFilterChange: handleGlobalFilterChange,
        manualPagination,
        pageCount,
        autoResetPageIndex: false,
        autoResetExpanded: false,
        onPaginationChange: handlePaginationChange,
        enableRowSelection,
        enableMultiRowSelection,
        onRowSelectionChange: handleRowSelectionChange,
        onColumnVisibilityChange: handleColumnVisibilityChange,
        onColumnOrderChange: handleColumnOrderChange,
        enableColumnPinning,
        onColumnPinningChange: handleColumnPinningChange,
        onExpandedChange: handleExpandedChange,
        getSubRows,
        enableGrouping,
        onGroupingChange: handleGroupingChange,
        getRowId,
    });

    useEffect(() => {
        if (tableRef) {
            (tableRef as RefObject<TanstackTable<TData> | null>).current = table;
        }
    }, [table, tableRef]);

    const renderSkeleton = () => (
        <div className={cn('overflow-hidden rounded-md border', className)}>
            <BaseTable className={tableClassName}>
                <DataTableContext.Provider value={table}>
                    <TableHeader
                        stickyHeader={stickyHeader}
                        className={headerClassName}
                    />
                </DataTableContext.Provider>
                <BaseTableBody className={bodyClassName}>
                    {Array.from({
                        length: loadingRows,
                    }).map((_, index) => (
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
                </BaseTableBody>
            </BaseTable>
        </div>
    );

    if (isLoading) return renderSkeleton();

    if (isError) {
        return (
            <div
                className={cn(
                    'flex flex-col items-center justify-center gap-3 rounded-md border px-6 py-12 text-center',
                    className,
                )}
            >
                <div className="flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                    <TriangleAlert className="size-5" />
                </div>
                <p className="font-medium text-sm">{errorMessage}</p>
                {onRetry && (
                    <Button
                        onClick={onRetry}
                        variant="outline"
                        size="sm"
                    >
                        <RotateCcw className="size-4" />
                        Повторить
                    </Button>
                )}
            </div>
        );
    }

    const selectedRows: TData[] = bulkActions
        ? table.getSelectedRowModel().rows.map((row) => row.original)
        : [];

    const selectionActions =
        bulkActions && selectedRows.length > 0 ? (
            <>
                {bulkActions(selectedRows)}
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => table.resetRowSelection()}
                >
                    Сбросить
                </Button>
            </>
        ) : undefined;

    return (
        <DataTableContext.Provider value={table}>
            <div className={cn('flex flex-col gap-1', className)}>
                {(showToolbar || customActions) && (
                    <TableToolbar
                        placeholder={toolbarPlaceholder}
                        actions={toolbarActions}
                        customAction={customActions}
                    />
                )}
                <div className="overflow-hidden rounded-md border">
                    <BaseTable className={tableClassName}>
                        <TableHeader
                            stickyHeader={stickyHeader}
                            className={headerClassName}
                        />
                        <TableBody<TData>
                            bodyClassName={bodyClassName}
                            cellClassName={cellClassName}
                            rowClassName={rowClassName}
                            highlightOnHover={highlightOnHover}
                            stripedRows={stripedRows}
                            onRowClick={onRowClick}
                            onRowDoubleClick={onRowDoubleClick}
                            emptyMessage={emptyMessage}
                            enableExpanding={enableExpanding}
                            renderSubComponent={renderSubComponent}
                        />
                        {showFooter && <TableFooter />}
                    </BaseTable>
                </div>
                {enablePagination && (
                    <TablePagination
                        pageSizeOptions={pageSizeOptions}
                        selectionActions={selectionActions}
                    />
                )}
                {!enablePagination && selectionActions && (
                    <div className="flex min-h-8 items-center gap-2 px-2 py-3 text-xs text-muted-foreground">
                        Выбрано: {selectedRows.length}
                        {selectionActions}
                    </div>
                )}
                {caption && <TableCaption>{caption}</TableCaption>}
            </div>
        </DataTableContext.Provider>
    );
};

export * from './components';
export { editDeleteColumn } from './lib/editDeleteColumn';
