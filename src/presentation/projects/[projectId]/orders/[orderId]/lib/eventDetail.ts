import type { Currency } from '@/shared/constants/currency';
import { fmtMoney } from '@/shared/format/money';
import { ORDER_STATUS_LABEL } from '@/shared/labels/order';
import { PAYMENT_METHOD_LABEL } from '@/shared/labels/payment';
import {
    isOrderStatus,
    OrderEventType,
    type OrderEventView,
} from '@/contexts/order';
import { isPaymentMethod } from '@/contexts/payment';

export function eventDetail(
    { type, payload }: OrderEventView,
    currency: Currency,
): string | undefined {
    const reason =
        typeof payload.reason === 'string' && payload.reason
            ? ` · ${payload.reason}`
            : '';

    if (type === OrderEventType.STATUS_CHANGED) {
        const { from, to } = payload;

        if (typeof from !== 'string' || typeof to !== 'string')
            return undefined;
        if (!isOrderStatus(from) || !isOrderStatus(to)) return undefined;

        return `${ORDER_STATUS_LABEL[from]} → ${ORDER_STATUS_LABEL[to]}${reason}`;
    }

    if (
        type === OrderEventType.PAYMENT_RECORDED &&
        typeof payload.amount === 'number'
    ) {
        const method =
            typeof payload.method === 'string' &&
            isPaymentMethod(payload.method)
                ? ` · ${PAYMENT_METHOD_LABEL[payload.method]}`
                : '';

        return `+${fmtMoney(payload.amount, currency)}${method}`;
    }

    if (
        type === OrderEventType.REFUND_RECORDED &&
        typeof payload.amount === 'number'
    ) {
        return `−${fmtMoney(payload.amount, currency)}${reason}`;
    }

    return undefined;
}
