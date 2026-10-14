'use client';

'use no memo';

import type { ReactNode } from 'react';
import { Button, Input } from '@/ui/Base';
import { useDataTable } from '@/ui/Base/Table/context';
import { Search, X } from 'lucide-react';

interface TableToolbarProps {
    placeholder?: string;
    actions?: ReactNode;
    customAction?: ReactNode;
}

export const TableToolbar = ({
    placeholder = 'Поиск…',
    actions,
    customAction,
}: TableToolbarProps) => {
    const table = useDataTable();
    const value = (table.getState().globalFilter as string | undefined) ?? '';

    return (
        <div className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
            {customAction && customAction}
            {!customAction && (
                <div className="relative w-full sm:max-w-sm">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={value}
                        onChange={(event) => table.setGlobalFilter(event.target.value)}
                        placeholder={placeholder}
                        className="pl-8"
                    />
                    {value && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="absolute right-1 top-1/2 -translate-y-1/2"
                            onClick={() => table.setGlobalFilter('')}
                            aria-label="Очистить поиск"
                        >
                            <X className="size-3.5" />
                        </Button>
                    )}
                </div>
            )}
            {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
    );
};
