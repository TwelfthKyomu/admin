import { ROUTES } from '@/shared/constants';
import { fmtDateTime } from '@/shared/format/date';
import { STOCK_MOVEMENT_REASON_LABEL } from '@/shared/labels/catalog';
import { type StockMovementView, stockKey } from '@/contexts/stockMovement';
import { createColumnHelper } from '@tanstack/react-table';
import Link from 'next/link';

const { accessor, display } = createColumnHelper<StockMovementView>();

interface MovementColumnsProps {
    projectId: string;
    productNames: Map<string, string>;
    warehouseNames: Map<string, string>;
}

export const MOVEMENT_COLUMNS = ({
    projectId,
    productNames,
    warehouseNames,
}: MovementColumnsProps) => [
    accessor('occurredAt', {
        header: 'Когда',
        cell: ({ getValue }) => fmtDateTime(getValue()),
    }),
    display({
        id: 'product',
        header: 'Товар',
        cell: ({ row: { original } }) => (
            <div className="max-w-72 truncate">
                {productNames.get(
                    stockKey({
                        productId: original.productId,
                        variantId: original.variantId ?? null,
                    }),
                ) ?? 'Удалённый товар'}
            </div>
        ),
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
    accessor('orderId', {
        header: 'Заказ',
        cell: ({ getValue }) => {
            const orderId = getValue();

            if (!orderId) return '—';

            return (
                <Link
                    className="underline-offset-4 hover:underline"
                    href={ROUTES.project(projectId, 'orders', orderId)}
                    onClick={(event) => event.stopPropagation()}
                >
                    Открыть
                </Link>
            );
        },
    }),
    accessor('note', {
        header: 'Комментарий',
        cell: ({ getValue }) => getValue() ?? '—',
    }),
];
