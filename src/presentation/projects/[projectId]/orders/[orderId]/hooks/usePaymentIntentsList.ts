'use client';

import { fmtMoney } from '@/shared/format/money';
import { confirmDestructive } from '@/shared/lib/modal';
import {
    type PaymentIntentView,
    useRefundUnappliedIntent,
} from '@/contexts/paymentIntent';

export const usePaymentIntentsList = (projectId: string) => {
    const refund = useRefundUnappliedIntent();

    const onRefund = (intent: PaymentIntentView) =>
        confirmDestructive({
            title: 'Вернуть деньги клиенту?',
            description: `Провайдер вернёт ${fmtMoney(intent.amount, intent.currency)} на карту клиента. На заказ эта оплата не зачислялась.`,
            confirmLabel: 'Вернуть',
            success: 'Возврат отправлен провайдеру',
            onConfirm: () => refund.mutateAsync({ id: intent.id, projectId }),
        });

    return { refund, onRefund };
};
