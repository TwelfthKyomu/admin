import {
    CARRIER_SETTABLE_STATUSES,
    type CarrierSettableStatus,
    type DeliveryStatus,
} from '@/contexts/delivery';
import { addMinutes } from 'date-fns';

export function isCarrierSettable(
    status: DeliveryStatus,
): status is CarrierSettableStatus {
    return CARRIER_SETTABLE_STATUSES.some((value) => value === status);
}

export function defaultDeliveryWindow(): { start: Date; end: Date } {
    const start = new Date();

    start.setMinutes(start.getMinutes() < 30 ? 30 : 60, 0, 0);

    return { start, end: addMinutes(start, 120) };
}
