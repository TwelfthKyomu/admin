import { fmtTime, fmtTimeRange } from '@/shared/format/date';
import {
    DeliveryStatus,
    type DeliveryView,
    isActiveDelivery,
} from '@/contexts/delivery';

export function deliveryWindowLabel(delivery: DeliveryView): string {
    if (delivery.status === DeliveryStatus.DELIVERED && delivery.deliveredAt) {
        return `в ${fmtTime(new Date(delivery.deliveredAt))}`;
    }

    if (!delivery.windowStart || !delivery.windowEnd) return 'без окна';

    return fmtTimeRange(delivery.windowStart, delivery.windowEnd);
}

export function isLateDelivery(
    delivery: DeliveryView,
    now = new Date(),
): boolean {
    return (
        isActiveDelivery(delivery.status) &&
        !!delivery.windowEnd &&
        new Date(delivery.windowEnd) < now
    );
}

export function byDeliveryStatus(
    deliveries: DeliveryView[],
    statuses: DeliveryStatus[],
): DeliveryView[] {
    return deliveries.filter((delivery) => statuses.includes(delivery.status));
}

export function byDeliveryWindow(a: DeliveryView, b: DeliveryView): number {
    return (
        new Date(a.windowStart ?? a.createdAt).getTime() -
        new Date(b.windowStart ?? b.createdAt).getTime()
    );
}
