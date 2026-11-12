import type { WarehouseView } from '@/contexts/warehouse';
import { ActionTableButton, Badge } from '@/ui/Base';
import { createColumnHelper } from '@tanstack/react-table';
import { type WarehouseActionHandlers, warehouseActionItems } from '../lib/warehouseActions';

const { accessor, display } = createColumnHelper<WarehouseView>();

export const WAREHOUSE_COLUMNS = (handlers: WarehouseActionHandlers) => [
    accessor('name', {
        header: 'Склад',
        cell: ({ row: { original, index } }) => (
            <div className="flex items-center gap-2">
                {original.name}
                {index === 0 && <Badge variant="secondary">Основной</Badge>}
            </div>
        ),
    }),
    accessor('forSite', {
        header: 'На сайте',
        cell: ({ getValue }) => (
            <Badge variant={getValue() ? 'default' : 'outline'}>
                {getValue() ? 'Продаётся' : 'Нет'}
            </Badge>
        ),
    }),
    display({
        id: 'actions',
        header: '',
        size: 5,
        cell: ({ row: { original, index } }) => (
            <ActionTableButton items={warehouseActionItems(original, index === 0, handlers)} />
        ),
    }),
];
