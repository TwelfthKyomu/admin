import { PAYMENT_METHOD_LABEL } from '@/shared/labels/payment';
import type { PaymentMethodTotalView } from '@/contexts/cashShift';
import { PaymentMethod } from '@/contexts/payment';

export function paymentMethodLabel(row: PaymentMethodTotalView): string {
    if (row.method === PaymentMethod.CASH) {
        return row.atCourier ? 'Наличные у курьеров' : 'Наличные в кассе';
    }

    const base = row.method ? PAYMENT_METHOD_LABEL[row.method] : 'Без способа';

    return row.atCourier ? `${base} у курьеров` : base;
}
