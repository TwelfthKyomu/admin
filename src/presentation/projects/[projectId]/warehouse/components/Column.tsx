import { PRODUCT_TYPE_LABEL } from '@/shared/labels/catalog';
import type { StockLevelView } from '@/contexts/stockMovement';
import type { WarehouseView } from '@/contexts/warehouse';
import { ActionTableButton, Badge } from '@/ui/Base';
import { createColumnHelper } from '@tanstack/react-table';
import { stockActionItems } from '../lib/stockActions';
import type { StockOperationType } from '../lib/stockOperation';

const { accessor, display } = createColumnHelper<StockLevelView>();

interface OverviewColumnsProps {
    warehouses: WarehouseView[];
    onOperation: (type: StockOperationType, row: StockLevelView) => void;
    onTransfer: (row: StockLevelView) => void;
}

export const OVERVIEW_COLUMNS = ({ warehouses, ...handlers }: OverviewColumnsProps) => [
    accessor('name', {
        header: 'Товар',
        cell: ({ getValue }) => <div className="max-w-72 truncate">{getValue()}</div>,
    }),
    accessor('sku', {
        header: 'Артикул',
        cell: ({ getValue }) => <code>{getValue()}</code>,
    }),
    accessor('type', {
        header: 'Тип',
        cell: ({ getValue }) => PRODUCT_TYPE_LABEL[getValue()],
    }),
    ...(warehouses.length > 1
        ? warehouses.map((warehouse) =>
              display({
                  id: warehouse.id,
                  header: warehouse.name,
                  cell: ({ row: { original } }) =>
                      original.stock === undefined
                          ? '—'
                          : (original.byWarehouse[warehouse.id] ?? 0),
              }),
          )
        : []),
    accessor('stock', {
        header: 'Всего',
        cell: ({ getValue }) => {
            const stock = getValue();

            if (stock === undefined) return 'не учитывается';

            return <Badge variant={stock === 0 ? 'destructive' : 'secondary'}>{stock}</Badge>;
        },
    }),
    accessor('reserved', {
        header: 'В брони',
        cell: ({ getValue }) => getValue() || '—',
    }),
    display({
        id: 'actions',
        header: '',
        size: 5,
        cell: ({ row: { original } }) => (
            <ActionTableButton items={stockActionItems(original, warehouses.length, handlers)} />
        ),
    }),
];
