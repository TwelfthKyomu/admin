import { fmtDateTime } from '@/shared/format/date';
import { STOCK_MOVEMENT_REASON_LABEL } from '@/shared/labels/catalog';
import { type StockMovementView, stockKey } from '@/contexts/stockMovement';
import { createColumnHelper } from '@tanstack/react-table';

const { accessor, display } = createColumnHelper<StockMovementView>();

interface MovementColumnsProps {
    productNames: Map<string, string>;
    warehouseNames: Map<string, string>;
}

export const MOVEMENT_COLUMNS = ({ productNames, warehouseNames }: MovementColumnsProps) => [
    accessor('occurredAt', {
        header: 'Когда',
        cell: ({ getValue }) => fmtDateTime(getValue()),
    }),
    display({
        id: 'product',
        header: 'Товар',
        cell: ({ row: { original } }) =>
            productNames.get(
                stockKey({ productId: original.productId, variantId: original.variantId ?? null }),
            ) ?? 'Удалённый товар',
    }),
    accessor('warehouseId', {
        header: 'Склад',
        cell: ({ getValue }) => warehouseNames.get(getValue()) ?? 'Удалённый склад',
    }),
    accessor('reason', {
        header: 'Причина',
        cell: ({ getValue }) => STOCK_MOVEMENT_REASON_LABEL[getValue()],
    }),
    accessor('quantityDelta', {
        header: 'Изменение',
        cell: ({ getValue }) => (getValue() > 0 ? `+${getValue()}` : getValue()),
    }),
    accessor('note', {
        header: 'Комментарий',
        cell: ({ getValue }) => getValue() ?? '—',
    }),
];
