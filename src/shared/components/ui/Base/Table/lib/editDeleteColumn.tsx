'use no memo';

import type { ReactNode } from 'react';
import { ActionTableButton } from '@/ui/Base';
import { createColumnHelper } from '@tanstack/react-table';

interface EditDeleteColumnOptions<T> {
    onEdit: (row: T) => void;
    onDelete: (row: T) => void;
    isDeleting: boolean;
    renderInstead?: (row: T) => ReactNode;
}

export function editDeleteColumn<T>({
    onEdit,
    onDelete,
    isDeleting,
    renderInstead,
}: EditDeleteColumnOptions<T>) {
    return createColumnHelper<T>().display({
        id: 'actions',
        header: '',
        enableSorting: false,
        size: 5,
        cell: ({ row }) => {
            const instead = renderInstead?.(row.original);

            if (instead) return instead;

            return (
                <ActionTableButton
                    items={[
                        {
                            key: 'edit',
                            label: 'Изменить',
                            onSelect: () => onEdit(row.original),
                        },
                        {
                            key: 'delete',
                            label: 'Удалить',
                            variant: 'destructive',
                            disabled: isDeleting,
                            separator: true,
                            onSelect: () => onDelete(row.original),
                        },
                    ]}
                />
            );
        },
    });
}
