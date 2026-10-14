'use client';

'use no memo';

import { useDataTable } from '@/ui/Base/Table/context';
import { TableFooter as BaseTableFooter, TableCell, TableRow } from '@/ui/Base/Table/primitives';
import { flexRender } from '@tanstack/react-table';

export const TableFooter = () => {
    const table = useDataTable();

    return (
        <BaseTableFooter className="border-t bg-muted/30">
            {table.getFooterGroups().map((footerGroup) => (
                <TableRow key={footerGroup.id}>
                    {footerGroup.headers.map((header) => (
                        <TableCell key={header.id}>
                            {header.isPlaceholder
                                ? null
                                : flexRender(header.column.columnDef.footer, header.getContext())}
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </BaseTableFooter>
    );
};
