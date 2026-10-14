import { createOptions } from '@/shared/lib/createOptions';
import type { BadgeVariant } from '@/shared/types';
import { PAYMENT_METHOD_VALUES, PaymentMethod } from '@/contexts/payment';
import {
    PAYMENT_PROVIDER_VALUES,
    PaymentIntentStatus,
    PaymentProvider,
} from '@/contexts/paymentIntent';

export const PAYMENT_INTENT_STATUS_LABEL: Record<PaymentIntentStatus, string> =
    {
        [PaymentIntentStatus.PENDING]: 'Ожидает',
        [PaymentIntentStatus.SUCCEEDED]: 'Оплачен',
        [PaymentIntentStatus.CANCELLED]: 'Отменён',
    };

export const PAYMENT_INTENT_STATUS_VARIANT: Record<
    PaymentIntentStatus,
    BadgeVariant
> = {
    [PaymentIntentStatus.PENDING]: 'secondary',
    [PaymentIntentStatus.SUCCEEDED]: 'default',
    [PaymentIntentStatus.CANCELLED]: 'outline',
};

export const PAYMENT_PROVIDER_LABEL: Record<PaymentProvider, string> = {
    [PaymentProvider.YOOKASSA]: 'ЮKassa',
    [PaymentProvider.CLOUDPAYMENTS]: 'Cloudpayments',
    [PaymentProvider.STRIPE]: 'Stripe',
};

export const PAYMENT_PROVIDER_AVAILABLE: Record<PaymentProvider, boolean> = {
    [PaymentProvider.YOOKASSA]: false,
    [PaymentProvider.CLOUDPAYMENTS]: false,
    [PaymentProvider.STRIPE]: true,
};

export const PAYMENT_PROVIDER_OPTIONS = PAYMENT_PROVIDER_VALUES.map(
    (value) => ({
        value,
        label: PAYMENT_PROVIDER_AVAILABLE[value]
            ? PAYMENT_PROVIDER_LABEL[value]
            : `${PAYMENT_PROVIDER_LABEL[value]} (скоро)`,
    }),
);

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
    [PaymentMethod.CASH]: 'Наличные',
    [PaymentMethod.CARD]: 'Карта',
    [PaymentMethod.TRANSFER]: 'Перевод',
    [PaymentMethod.ONLINE]: 'Онлайн-оплата',
    [PaymentMethod.OTHER]: 'Другое',
};

export const PAYMENT_METHOD_OPTIONS = createOptions(
    PAYMENT_METHOD_VALUES,
    PAYMENT_METHOD_LABEL,
);

export type PaymentModalMode = 'payment' | 'refund';

interface PaymentDialogLabel {
    title: string;
    description: string;
    submit: string;
    submitVariant: 'default' | 'destructive';
    amountHint: string;
    methodLabel: string;
    methodHint: Partial<Record<PaymentMethod, string>>;
    success: string;
}

export const PAYMENT_DIALOG_LABEL: Record<
    PaymentModalMode,
    PaymentDialogLabel
> = {
    payment: {
        title: 'Записать платёж',
        description: 'Зафиксируйте полученные деньги от клиента.',
        submit: 'Записать',
        submitVariant: 'default',
        amountHint: 'Максимум',
        methodLabel: 'Способ оплаты',
        methodHint: {
            [PaymentMethod.CASH]: 'Наличные лягут в открытую кассовую смену',
        },
        success: 'Записано',
    },
    refund: {
        title: 'Возврат',
        description: 'Возврат уменьшит net-оплату заказа.',
        submit: 'Оформить возврат',
        submitVariant: 'destructive',
        amountHint: 'Доступно для возврата',
        methodLabel: 'Способ возврата',
        methodHint: {
            [PaymentMethod.ONLINE]:
                'Деньги вернёт платёжный провайдер на карту, с которой платили',
            [PaymentMethod.CASH]:
                'Возврат наличными уменьшит ожидаемую сумму в кассе',
        },
        success: 'Возвращено',
    },
};
