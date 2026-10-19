import { fmtDateTime } from '@/shared/format/date';
import {
    ORDER_STATUS_LABEL,
    PAYMENT_STATUS_LABEL,
} from '@/shared/labels/order';
import { csvAmount, downloadCsv } from '@/shared/lib/csv';
import { type OrderView, orderNumber } from '@/contexts/order';

export function exportOrders(orders: OrderView[]): void {
    downloadCsv(
        `orders-${new Date().toISOString().slice(0, 10)}.csv`,
        [
            '№',
            'Дата',
            'Клиент',
            'Телефон',
            'Email',
            'Статус',
            'Оплата',
            'Сумма',
            'Оплачено',
            'Валюта',
        ],
        orders.map((order) => [
            orderNumber(order),
            fmtDateTime(order.createdAt),
            order.customerName,
            order.customerPhone,
            order.customerEmail,
            ORDER_STATUS_LABEL[order.status],
            PAYMENT_STATUS_LABEL[order.paymentStatus],
            csvAmount(order.totalAmount),
            csvAmount(order.paidAmount),
            order.currency,
        ]),
    );
}
