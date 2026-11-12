'use client';

'use no memo';

import { Checkbox } from '@/ui/Base';
import type { Row, Table } from '@tanstack/react-table';
import { headerCheckedState } from '../../lib/selection';

interface HeaderProps<TData> {
    table: Table<TData>;
}

interface RowProps<TData> {
    row: Row<TData>;
}

export const CheckboxHeader = <TData,>({ table }: HeaderProps<TData>) => (
    <Checkbox
        checked={headerCheckedState(table)}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(value === true)}
        aria-label="Выбрать все строки"
    />
);

export const CheckboxRow = <TData,>({ row }: RowProps<TData>) => {
    return (
        <Checkbox
            checked={row.getIsSelected()}
            disabled={!row.getCanSelect()}
            onClick={(event) => event.stopPropagation()}
            onCheckedChange={(value) => row.toggleSelected(value === true)}
            aria-label="Выбрать строку"
        />
    );
};
