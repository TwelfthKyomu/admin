import { fmtDateTime } from '@/shared/format/date';
import { fmtMoney } from '@/shared/format/money';
import {
    ORDER_STATUS_LABEL,
    ORDER_STATUS_VARIANT,
    PAYMENT_STATUS_LABEL,
    PAYMENT_STATUS_VARIANT,
} from '@/shared/labels/order';
import { type OrderView, orderNumber } from '@/contexts/order';
import { Badge } from '@/ui/Base';
import { createColumnHelper } from '@tanstack/react-table';
import { sellerLabel } from '../lib/sellers';

const { display, accessor } = createColumnHelper<OrderView>();

interface ColumnsProps {
    sellerNames?: Map<string, string>;
}

export const COLUMNS = ({ sellerNames }: ColumnsProps) => [
    display({
        id: 'number',
        header: '№',
        cell: ({ row: { original } }) => (
            <span className="font-mono text-muted-foreground text-xs">{orderNumber(original)}</span>
        ),
    }),
    display({
        id: 'date',
        header: 'Дата',
        cell: ({ row: { original } }) => fmtDateTime(original.createdAt),
    }),
    accessor('customerName', {
        header: 'Клиент',
        cell: ({ row: { original } }) => (
            <div>
                <div>{original.customerName ?? 'Без имени'}</div>
                {original.customerPhone && <div>{original.customerPhone}</div>}
            </div>
        ),
    }),
    ...(sellerNames
        ? [
              display({
                  id: 'seller',
                  header: 'Продавец',
                  cell: ({ row: { original } }) => sellerLabel(original.sellerId, sellerNames),
              }),
          ]
        : []),
    accessor('status', {
        header: 'Статус',
        cell: ({ getValue }) => (
            <Badge variant={ORDER_STATUS_VARIANT[getValue()]}>
                {ORDER_STATUS_LABEL[getValue()]}
            </Badge>
        ),
    }),
    accessor('paymentStatus', {
        header: 'Оплата',
        cell: ({ getValue }) => (
            <Badge variant={PAYMENT_STATUS_VARIANT[getValue()]}>
                {PAYMENT_STATUS_LABEL[getValue()]}
            </Badge>
        ),
    }),
    accessor('totalAmount', {
        header: 'Сумма',
        cell: ({ row: { original } }) => fmtMoney(original.totalAmount, original.currency),
    }),
];
