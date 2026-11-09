import type { WarehouseView } from '@/contexts/warehouse';
import { Badge } from '@/ui/Base';
import { editDeleteColumn } from '@/ui/Base/Table';
import { createColumnHelper } from '@tanstack/react-table';

const { accessor } = createColumnHelper<WarehouseView>();

interface WarehouseColumnsProps {
    onEdit: (warehouse: WarehouseView) => void;
    onDelete: (warehouse: WarehouseView) => void;
    isDeleting: boolean;
}

export const WAREHOUSE_COLUMNS = (props: WarehouseColumnsProps) => [
    accessor('name', { header: 'Склад' }),
    accessor('forSite', {
        header: 'На сайте',
        cell: ({ getValue }) => (
            <Badge variant={getValue() ? 'default' : 'outline'}>
                {getValue() ? 'Продаётся' : 'Нет'}
            </Badge>
        ),
    }),
    editDeleteColumn(props),
];
