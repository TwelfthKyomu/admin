import { createOptions } from '@/shared/lib/createOptions';
import type { BadgeVariant } from '@/shared/types';
import {
    CARRIER_SETTABLE_STATUSES,
    DELIVERY_CARRIER_VALUES,
    DeliveryCarrier,
    DeliveryKind,
    DeliveryStatus,
} from '@/contexts/delivery/Delivery.types';

export const DELIVERY_KIND_LABEL: Record<DeliveryKind, string> = {
    [DeliveryKind.COURIER]: 'Курьером',
    [DeliveryKind.CARRIER]: 'Службой доставки',
};

export const DELIVERY_KIND_OPTIONS = createOptions(
    [DeliveryKind.COURIER, DeliveryKind.CARRIER],
    DELIVERY_KIND_LABEL,
);

const DELIVERY_STATUS_LABEL: Record<DeliveryStatus, string> = {
    [DeliveryStatus.QUEUED]: 'В очереди',
    [DeliveryStatus.ASSIGNED]: 'Назначена',
    [DeliveryStatus.PICKED_UP]: 'В пути',
    [DeliveryStatus.DELIVERED]: 'Доставлено',
    [DeliveryStatus.FAILED]: 'Не доставлено',
    [DeliveryStatus.RETURNED]: 'Возврат',
    [DeliveryStatus.CANCELLED]: 'Отменена',
};

export function deliveryStatusLabel(
    kind: DeliveryKind,
    status: DeliveryStatus,
): string {
    if (kind === DeliveryKind.CARRIER && status === DeliveryStatus.QUEUED) {
        return 'Ожидает отправки';
    }

    return DELIVERY_STATUS_LABEL[status];
}

export const DELIVERY_STATUS_VARIANT: Record<DeliveryStatus, BadgeVariant> = {
    [DeliveryStatus.QUEUED]: 'outline',
    [DeliveryStatus.ASSIGNED]: 'secondary',
    [DeliveryStatus.PICKED_UP]: 'secondary',
    [DeliveryStatus.DELIVERED]: 'default',
    [DeliveryStatus.FAILED]: 'destructive',
    [DeliveryStatus.RETURNED]: 'destructive',
    [DeliveryStatus.CANCELLED]: 'outline',
};

export const DELIVERY_CARRIER_LABEL: Record<DeliveryCarrier, string> = {
    [DeliveryCarrier.CDEK]: 'СДЭК',
    [DeliveryCarrier.BOXBERRY]: 'Boxberry',
    [DeliveryCarrier.RUSSIAN_POST]: 'Почта России',
    [DeliveryCarrier.YANDEX]: 'Яндекс Доставка',
    [DeliveryCarrier.OTHER]: 'Другая служба',
};

export const DELIVERY_CARRIER_OPTIONS = createOptions(
    DELIVERY_CARRIER_VALUES,
    DELIVERY_CARRIER_LABEL,
);

export const CARRIER_STATUS_OPTIONS = CARRIER_SETTABLE_STATUSES.map(
    (value) => ({
        value,
        label: deliveryStatusLabel(DeliveryKind.CARRIER, value),
    }),
);
