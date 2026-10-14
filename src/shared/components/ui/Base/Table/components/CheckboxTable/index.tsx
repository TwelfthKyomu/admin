'use client';

'use no memo';

import { Checkbox } from '@/ui/Base';
import type { Row, Table } from '@tanstack/react-table';

interface HeaderProps<TData> {
    table: Table<TData>;
}

interface RowProps<TData> {
    row: Row<TData>;
}

export const CheckboxHeader = <TData,>({ table }: HeaderProps<TData>) => {
    const allSelected = table.getIsAllPageRowsSelected();
    const someSelected = table.getIsSomePageRowsSelected();

    return (
        <Checkbox
            checked={allSelected ? true : someSelected ? 'indeterminate' : false}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(value === true)}
            aria-label="Выбрать все строки"
        />
    );
};

export const CheckboxRow = <TData,>({ row }: RowProps<TData>) => {
    return (
        <Checkbox
            checked={row.getIsSelected()}
            disabled={!row.getCanSelect()}
            onCheckedChange={(value) => row.toggleSelected(value === true)}
            aria-label="Выбрать строку"
        />
    );
};
