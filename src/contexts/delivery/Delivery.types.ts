import { ApplicationError } from '@/shared/api/errors';
import { enumValues } from '@/shared/lib/enum';
import type { OrderRecord } from '@/contexts/order/Orders.table';
import type { DeliveryRecord } from './Deliveries.table';

export const DeliveryKind = {
    COURIER: 'courier',
    CARRIER: 'carrier',
} as const;

export type DeliveryKind = (typeof DeliveryKind)[keyof typeof DeliveryKind];

export const DELIVERY_KIND_VALUES = enumValues(DeliveryKind);

export const DeliveryStatus = {
    QUEUED: 'queued',
    ASSIGNED: 'assigned',
    PICKED_UP: 'picked_up',
    DELIVERED: 'delivered',
    FAILED: 'failed',
    RETURNED: 'returned',
    CANCELLED: 'cancelled',
} as const;

export type DeliveryStatus =
    (typeof DeliveryStatus)[keyof typeof DeliveryStatus];

export const DELIVERY_STATUS_VALUES = enumValues(DeliveryStatus);

export const ACTIVE_DELIVERY_STATUSES: readonly DeliveryStatus[] = [
    DeliveryStatus.QUEUED,
    DeliveryStatus.ASSIGNED,
    DeliveryStatus.PICKED_UP,
];

export const OPEN_DELIVERY_STATUSES: readonly DeliveryStatus[] = [
    ...ACTIVE_DELIVERY_STATUSES,
    DeliveryStatus.FAILED,
];

export const IN_WORK_DELIVERY_STATUSES: readonly DeliveryStatus[] = [
    DeliveryStatus.ASSIGNED,
    DeliveryStatus.PICKED_UP,
];

export type MyDeliveryView = Pick<
    DeliveryRecord,
    | 'id'
    | 'projectId'
    | 'orderId'
    | 'status'
    | 'windowStart'
    | 'windowEnd'
    | 'address'
    | 'recipientName'
>;

export const FINISHED_DELIVERY_STATUSES: readonly DeliveryStatus[] = [
    DeliveryStatus.DELIVERED,
    DeliveryStatus.FAILED,
];

export function isActiveDelivery(status: DeliveryStatus): boolean {
    return ACTIVE_DELIVERY_STATUSES.includes(status);
}

export function isOpenDelivery(status: DeliveryStatus): boolean {
    return OPEN_DELIVERY_STATUSES.includes(status);
}

export function assertDeliveryWindow(windowStart: Date, windowEnd: Date): void {
    if (windowEnd <= windowStart) {
        throw new ApplicationError('Конец окна раньше начала');
    }
}

export function deliveryTimeOf(
    delivery: Pick<DeliveryRecord, 'windowStart' | 'createdAt'>,
): Date {
    return delivery.windowStart ?? delivery.createdAt;
}

export const DeliveryCarrier = {
    CDEK: 'cdek',
    BOXBERRY: 'boxberry',
    RUSSIAN_POST: 'russian_post',
    YANDEX: 'yandex',
    OTHER: 'other',
} as const;

export type DeliveryCarrier =
    (typeof DeliveryCarrier)[keyof typeof DeliveryCarrier];

export const DELIVERY_CARRIER_VALUES = enumValues(DeliveryCarrier);

const DELIVERY_TRACK_URL: Record<
    DeliveryCarrier,
    (tracking: string) => string | undefined
> = {
    cdek: (trackingNumber) =>
        `https://www.cdek.ru/ru/tracking?order_id=${encodeURIComponent(trackingNumber)}`,
    boxberry: (trackingNumber) =>
        `https://account.boxberry.ru/info/?id=${encodeURIComponent(trackingNumber)}`,
    russian_post: (trackingNumber) =>
        `https://www.pochta.ru/tracking?barcode=${encodeURIComponent(trackingNumber)}`,
    yandex: (trackingNumber) =>
        `https://yandex.ru/delivery?track=${encodeURIComponent(trackingNumber)}`,
    other: () => undefined,
};

export function deliveryTrackUrl(delivery: {
    carrier?: DeliveryCarrier | null;
    trackingNumber?: string | null;
}): string | undefined {
    if (!delivery.carrier || !delivery.trackingNumber) return undefined;

    return DELIVERY_TRACK_URL[delivery.carrier](delivery.trackingNumber);
}

export const CARRIER_SETTABLE_STATUSES = [
    DeliveryStatus.QUEUED,
    DeliveryStatus.PICKED_UP,
    DeliveryStatus.DELIVERED,
    DeliveryStatus.RETURNED,
] as const;

export type CarrierSettableStatus = (typeof CARRIER_SETTABLE_STATUSES)[number];

export const DELIVERY_ADDRESS_MAX = 500;
export const DELIVERY_REASON_MAX = 255;

export interface DeliveryView
    extends Omit<DeliveryRecord, 'projectId' | 'organizationId'>,
        Pick<OrderRecord, 'customerName' | 'currency'> {
    courierName: string | null;
    amountDue: number;
}

export interface CourierPeriodView {
    delivered: number;
    failed: number;
    collected: number;
    handedOver: number;
}

export interface CourierStatsView extends CourierPeriodView {
    employeeId: string;
    name: string;
    onHand: number;
}
