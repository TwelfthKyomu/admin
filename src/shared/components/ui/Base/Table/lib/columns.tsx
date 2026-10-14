'use client';

import { CheckboxHeader, CheckboxRow } from '@/ui/Base/Table/components/CheckboxTable';
import type { ColumnDef, Row } from '@tanstack/react-table';

const SELECT_COLUMN_ID = '__select';

export function resolveTableColumns<TData>(
    columns: ColumnDef<TData, any>[],
    enableRowSelection: boolean | ((row: Row<TData>) => boolean),
): ColumnDef<TData, any>[] {
    if (!enableRowSelection || columns.some((column) => column.id === SELECT_COLUMN_ID)) {
        return columns;
    }

    return [
        {
            id: SELECT_COLUMN_ID,
            header: ({ table }) => <CheckboxHeader table={table} />,
            cell: ({ row }) => <CheckboxRow row={row} />,
            enableSorting: false,
            enableHiding: false,
            size: 36,
        },
        ...columns,
    ];
}
