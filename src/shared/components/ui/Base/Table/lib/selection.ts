import type { Table } from '@tanstack/react-table';

export const headerCheckedState = <TData>(
    table: Table<TData>,
): boolean | 'indeterminate' => {
    if (table.getIsAllPageRowsSelected()) return true;

    return table.getIsSomePageRowsSelected() ? 'indeterminate' : false;
};
