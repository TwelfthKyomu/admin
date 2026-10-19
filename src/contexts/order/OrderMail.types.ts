import type {
    OrderEmailAction,
    OrderEmailProps,
} from '@/infrastructure/email/templates/OrderEmail';
import { fmtMoney } from '@/shared/format/money';
import { DELIVERY_CARRIER_LABEL } from '@/shared/labels/delivery';
import { PAYMENT_STATUS_LABEL } from '@/shared/labels/order';
import type { DeliveryRecord } from '@/contexts/delivery/Deliveries.table';
import { deliveryTrackUrl } from '@/contexts/delivery/Delivery.types';
import { orderNumber } from './Order.types';
import type { OrderItemRecord, OrderRecord } from './Orders.table';

export interface MailOrder {
    order: OrderRecord;
    items: OrderItemRecord[];
    projectName: string;
    storefront: { siteUrl: string | null } | null;
}

export interface CustomerMailContent {
    heading: string;
    intro: string;
    details?: string[];
    action?: OrderEmailAction;
}

type ShippedDelivery = Pick<
    DeliveryRecord,
    'carrier' | 'trackingNumber' | 'address'
>;

export function orderLines(
    mail: MailOrder,
): Pick<OrderEmailProps, 'items' | 'discount' | 'total'> {
    const { order, items } = mail;

    return {
        items: items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            total: fmtMoney(item.totalAmount, order.currency),
        })),
        discount:
            order.discountAmount > 0
                ? fmtMoney(order.discountAmount, order.currency)
                : undefined,
        total: fmtMoney(order.totalAmount, order.currency),
    };
}

export function customerOrderAction(
    mail: MailOrder,
): OrderEmailAction | undefined {
    const siteUrl = mail.storefront?.siteUrl;

    if (!siteUrl) return undefined;

    return {
        label: 'Открыть заказ',
        url: `${siteUrl.replace(/\/+$/, '')}/orders/${mail.order.id}`,
    };
}

export function customerFooter(projectName: string): string {
    return `Вы получили это письмо, потому что оформили заказ в «${projectName}».`;
}

export function adminOrderUrl(
    appUrl: string,
    order: Pick<OrderRecord, 'id' | 'projectId'>,
): string {
    return `${appUrl.replace(/\/+$/, '')}/projects/${order.projectId}/orders/${order.id}`;
}

export function teamDetails(order: OrderRecord): string[] {
    return [
        `Покупатель: ${order.customerName ?? '—'}`,
        order.customerPhone && `Телефон: ${order.customerPhone}`,
        order.customerEmail && `Почта: ${order.customerEmail}`,
        `Оплата: ${PAYMENT_STATUS_LABEL[order.paymentStatus]}`,
        order.notes && `Комментарий: ${order.notes}`,
    ].filter((line) => line !== null);
}

export function placedContent(order: OrderRecord): CustomerMailContent {
    return {
        heading: `Заказ № ${orderNumber(order)} принят`,
        intro: 'Спасибо за заказ! Мы получили его и скоро свяжемся с вами.',
    };
}

export function paidContent(order: OrderRecord): CustomerMailContent {
    return {
        heading: `Заказ № ${orderNumber(order)} оплачен`,
        intro: 'Оплата получена. Мы собираем заказ и напишем, когда отправим его.',
    };
}

export function shippedContent(
    order: OrderRecord,
    delivery: ShippedDelivery,
): CustomerMailContent {
    if (!delivery.carrier) {
        return {
            heading: `Заказ № ${orderNumber(order)} в пути`,
            intro: 'Курьер выехал к вам с заказом.',
            details: [delivery.address && `Адрес: ${delivery.address}`].filter(
                (line) => line !== null,
            ),
        };
    }

    const trackUrl = deliveryTrackUrl(delivery);

    return {
        heading: `Заказ № ${orderNumber(order)} отправлен`,
        intro: 'Мы передали заказ в службу доставки.',
        details: [
            `Служба доставки: ${DELIVERY_CARRIER_LABEL[delivery.carrier]}`,
            delivery.trackingNumber && `Трек-номер: ${delivery.trackingNumber}`,
        ].filter((line) => line !== null),
        action: trackUrl
            ? { label: 'Отследить посылку', url: trackUrl }
            : undefined,
    };
}
