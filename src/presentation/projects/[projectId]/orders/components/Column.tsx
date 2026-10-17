import { fmtDateTime } from '@/shared/format/date';
import { fmtMoney } from '@/shared/format/money';
import {
    ORDER_STATUS_LABEL,
    ORDER_STATUS_VARIANT,
    ORDER_TYPE_LABEL,
    PAYMENT_STATUS_LABEL,
    PAYMENT_STATUS_VARIANT,
} from '@/shared/labels/order';
import { type OrderView, orderNumber } from '@/contexts/order';
import { Badge } from '@/ui/Base';
import { createColumnHelper } from '@tanstack/react-table';

const { display, accessor } = createColumnHelper<OrderView>();

export const COLUMNS = [
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
        cell: ({ row: { original } }) => fmtDateTime(original.scheduledAt ?? original.createdAt),
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
    accessor('type', {
        header: 'Тип',
        cell: ({ getValue }) => ORDER_TYPE_LABEL[getValue()],
    }),
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
