import type { BadgeVariant } from '@/shared/types';
import { OrderEventType, OrderStatus, PaymentStatus } from '@/contexts/order';

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
    [OrderStatus.PENDING]: 'Ожидает',
    [OrderStatus.CONFIRMED]: 'Подтверждён',
    [OrderStatus.IN_PROGRESS]: 'В работе',
    [OrderStatus.READY]: 'Готово',
    [OrderStatus.COMPLETED]: 'Завершён',
    [OrderStatus.CANCELLED]: 'Отменён',
};

export const ORDER_STATUS_LABEL_SHORT: Record<OrderStatus, string> = {
    [OrderStatus.PENDING]: 'Ожидают',
    [OrderStatus.CONFIRMED]: 'Подтв.',
    [OrderStatus.IN_PROGRESS]: 'В работе',
    [OrderStatus.READY]: 'Готовы',
    [OrderStatus.COMPLETED]: 'Завершены',
    [OrderStatus.CANCELLED]: 'Отменены',
};

export const ORDER_STATUS_VARIANT: Record<OrderStatus, BadgeVariant> = {
    [OrderStatus.PENDING]: 'secondary',
    [OrderStatus.CONFIRMED]: 'default',
    [OrderStatus.IN_PROGRESS]: 'default',
    [OrderStatus.READY]: 'default',
    [OrderStatus.COMPLETED]: 'default',
    [OrderStatus.CANCELLED]: 'destructive',
};

export const ORDER_STATUS_ACTION_LABEL: Record<OrderStatus, string> = {
    [OrderStatus.PENDING]: 'В ожидание',
    [OrderStatus.CONFIRMED]: 'Подтвердить',
    [OrderStatus.IN_PROGRESS]: 'Начать работу',
    [OrderStatus.READY]: 'Готово к выдаче',
    [OrderStatus.COMPLETED]: 'Завершить',
    [OrderStatus.CANCELLED]: 'Отменить',
};

export const ORDER_STATUS_ACTION_TONE: Record<
    OrderStatus,
    'default' | 'destructive'
> = {
    [OrderStatus.PENDING]: 'default',
    [OrderStatus.CONFIRMED]: 'default',
    [OrderStatus.IN_PROGRESS]: 'default',
    [OrderStatus.READY]: 'default',
    [OrderStatus.COMPLETED]: 'default',
    [OrderStatus.CANCELLED]: 'destructive',
};

export const ORDER_EVENT_LABEL: Record<OrderEventType, string> = {
    [OrderEventType.CREATED]: 'Заказ создан',
    [OrderEventType.STATUS_CHANGED]: 'Статус изменён',
    [OrderEventType.DISCOUNT_APPLIED]: 'Применена скидка',
    [OrderEventType.PAYMENT_RECORDED]: 'Записан платёж',
    [OrderEventType.REFUND_RECORDED]: 'Оформлен возврат',
    [OrderEventType.SHIPMENT_UPDATED]: 'Обновлена доставка',
    [OrderEventType.SELLER_CHANGED]: 'Изменён продавец',
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
    [PaymentStatus.UNPAID]: 'Не оплачен',
    [PaymentStatus.PARTIAL]: 'Частично',
    [PaymentStatus.PAID]: 'Оплачен',
    [PaymentStatus.REFUNDED]: 'Возврат',
};

export const PAYMENT_STATUS_VARIANT: Record<PaymentStatus, BadgeVariant> = {
    [PaymentStatus.UNPAID]: 'outline',
    [PaymentStatus.PARTIAL]: 'secondary',
    [PaymentStatus.PAID]: 'default',
    [PaymentStatus.REFUNDED]: 'destructive',
};
