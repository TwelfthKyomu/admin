import { fmtDateTime } from '@/shared/format/date';
import {
    ORDER_STATUS_LABEL,
    ORDER_TYPE_LABEL,
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
            'Тип',
            'Статус',
            'Оплата',
            'Сумма',
            'Оплачено',
            'Валюта',
        ],
        orders.map((order) => [
            orderNumber(order),
            fmtDateTime(order.scheduledAt ?? order.createdAt),
            order.customerName,
            order.customerPhone,
            order.customerEmail,
            ORDER_TYPE_LABEL[order.type],
            ORDER_STATUS_LABEL[order.status],
            PAYMENT_STATUS_LABEL[order.paymentStatus],
            csvAmount(order.totalAmount),
            csvAmount(order.paidAmount),
            order.currency,
        ]),
    );
}
