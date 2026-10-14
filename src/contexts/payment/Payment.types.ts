import { enumValues } from '@/shared/lib/enum';

export const PaymentDirection = {
    CHARGE: 'charge',
    REFUND: 'refund',
} as const;

export type PaymentDirection =
    (typeof PaymentDirection)[keyof typeof PaymentDirection];

export const PAYMENT_DIRECTION_VALUES = enumValues(PaymentDirection);

export const PaymentMethod = {
    CASH: 'cash',
    CARD: 'card',
    TRANSFER: 'transfer',
    ONLINE: 'online',
    OTHER: 'other',
} as const;

export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const PAYMENT_METHOD_VALUES = enumValues(PaymentMethod);

export function isPaymentMethod(value: string): value is PaymentMethod {
    return PAYMENT_METHOD_VALUES.some((method) => method === value);
}

export interface PaymentTotals {
    charged: number;
    refunded: number;
}

export function foldPaymentTotals<
    Row extends { direction: PaymentDirection; total: number },
>(rows: Row[], keyOf: (row: Row) => string | null): Map<string, PaymentTotals> {
    const totals = new Map<string, PaymentTotals>();

    for (const row of rows) {
        const key = keyOf(row);

        if (!key) continue;

        const current = totals.get(key) ?? { charged: 0, refunded: 0 };

        if (row.direction === PaymentDirection.CHARGE)
            current.charged += row.total;
        else current.refunded += row.total;

        totals.set(key, current);
    }

    return totals;
}
