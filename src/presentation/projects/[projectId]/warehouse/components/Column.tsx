import { fmtDateTime } from '@/shared/format/date';
import { PRODUCT_TYPE_LABEL, STOCK_MOVEMENT_REASON_LABEL } from '@/shared/labels/catalog';
import { ProductType } from '@/contexts/product';
import type { StockLevelView, StockMovementView } from '@/contexts/stockMovement';
import { Badge, Button } from '@/ui/Base';
import { createColumnHelper } from '@tanstack/react-table';

const overview = createColumnHelper<StockLevelView>();

interface OverviewColumnsProps {
    onAdjust: (row: StockLevelView) => void;
}

export const OVERVIEW_COLUMNS = ({ onAdjust }: OverviewColumnsProps) => [
    overview.accessor('name', { header: 'Товар' }),
    overview.accessor('sku', {
        header: 'SKU',
        cell: ({ getValue }) => <code>{getValue()}</code>,
    }),
    overview.accessor('type', {
        header: 'Тип',
        cell: ({ getValue }) => PRODUCT_TYPE_LABEL[getValue()],
    }),
    overview.accessor('stock', {
        header: 'Остаток',
        cell: ({ getValue }) => {
            const stock = getValue();

            if (stock === undefined) return 'не учитывается';

            return <Badge variant={stock === 0 ? 'destructive' : 'secondary'}>{stock}</Badge>;
        },
    }),
    overview.display({
        id: 'actions',
        header: '',
        cell: ({ row: { original } }) => {
            if (original.type === ProductType.SERVICE) {
                return null;
            }

            return (
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAdjust(original)}
                >
                    Корректировать
                </Button>
            );
        },
    }),
];

const movement = createColumnHelper<StockMovementView>();

export const MOVEMENT_COLUMNS = [
    movement.accessor('occurredAt', {
        header: 'Когда',
        cell: ({ getValue }) => fmtDateTime(getValue()),
    }),
    movement.accessor('reason', {
        header: 'Причина',
        cell: ({ getValue }) => STOCK_MOVEMENT_REASON_LABEL[getValue()],
    }),
    movement.accessor('quantityDelta', {
        header: 'Изменение',
        cell: ({ getValue }) => (getValue() > 0 ? `+${getValue()}` : getValue()),
    }),
    movement.accessor('note', {
        header: 'Комментарий',
        cell: ({ getValue }) => getValue() ?? '—',
    }),
];
