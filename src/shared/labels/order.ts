import type { BadgeVariant } from '@/shared/types';
import {
    OrderEventType,
    OrderStatus,
    OrderType,
    PaymentStatus,
} from '@/contexts/order';

export const ORDER_TYPE_LABEL: Record<OrderType, string> = {
    [OrderType.BOOKING]: 'Бронь',
    [OrderType.SALE]: 'Продажа',
    [OrderType.MIXED]: 'Смешан.',
};

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
    [OrderStatus.PENDING]: 'Ожидает',
    [OrderStatus.CONFIRMED]: 'Подтверждён',
    [OrderStatus.IN_PROGRESS]: 'В работе',
    [OrderStatus.COMPLETED]: 'Завершён',
    [OrderStatus.CANCELLED]: 'Отменён',
    [OrderStatus.NO_SHOW]: 'Не пришёл',
};

export const ORDER_STATUS_LABEL_SHORT: Record<OrderStatus, string> = {
    [OrderStatus.PENDING]: 'Ожидают',
    [OrderStatus.CONFIRMED]: 'Подтв.',
    [OrderStatus.IN_PROGRESS]: 'В работе',
    [OrderStatus.COMPLETED]: 'Завершены',
    [OrderStatus.CANCELLED]: 'Отменены',
    [OrderStatus.NO_SHOW]: 'Не пришли',
};

export const ORDER_STATUS_VARIANT: Record<OrderStatus, BadgeVariant> = {
    [OrderStatus.PENDING]: 'secondary',
    [OrderStatus.CONFIRMED]: 'default',
    [OrderStatus.IN_PROGRESS]: 'default',
    [OrderStatus.COMPLETED]: 'default',
    [OrderStatus.CANCELLED]: 'destructive',
    [OrderStatus.NO_SHOW]: 'destructive',
};

export const ORDER_STATUS_ACTION_LABEL: Record<OrderStatus, string> = {
    [OrderStatus.PENDING]: 'В ожидание',
    [OrderStatus.CONFIRMED]: 'Подтвердить',
    [OrderStatus.IN_PROGRESS]: 'Начать работу',
    [OrderStatus.COMPLETED]: 'Завершить',
    [OrderStatus.CANCELLED]: 'Отменить',
    [OrderStatus.NO_SHOW]: 'Не пришёл',
};

export const ORDER_STATUS_ACTION_TONE: Record<
    OrderStatus,
    'default' | 'destructive'
> = {
    [OrderStatus.PENDING]: 'default',
    [OrderStatus.CONFIRMED]: 'default',
    [OrderStatus.IN_PROGRESS]: 'default',
    [OrderStatus.COMPLETED]: 'default',
    [OrderStatus.CANCELLED]: 'destructive',
    [OrderStatus.NO_SHOW]: 'destructive',
};

export const ORDER_EVENT_LABEL: Record<OrderEventType, string> = {
    [OrderEventType.CREATED]: 'Заказ создан',
    [OrderEventType.STATUS_CHANGED]: 'Статус изменён',
    [OrderEventType.DISCOUNT_APPLIED]: 'Применена скидка',
    [OrderEventType.PAYMENT_RECORDED]: 'Записан платёж',
    [OrderEventType.REFUND_RECORDED]: 'Оформлен возврат',
    [OrderEventType.ASSIGNED_EMPLOYEE_CHANGED]: 'Изменён сотрудник',
    [OrderEventType.SCHEDULED_AT_CHANGED]: 'Изменено время',
    [OrderEventType.SHIPMENT_UPDATED]: 'Обновлена доставка',
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
