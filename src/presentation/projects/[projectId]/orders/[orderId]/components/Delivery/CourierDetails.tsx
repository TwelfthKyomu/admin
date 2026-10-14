import { fmtDateTime, fmtTime } from '@/shared/format/date';
import { fmtMoney } from '@/shared/format/money';
import type { DeliveryView } from '@/contexts/delivery';
import { DetailRow } from '../DetailRow';

export const CourierDetails = ({ delivery }: { delivery: DeliveryView }) => (
    <>
        <DetailRow
            label="Курьер"
            value={delivery.courierName ?? 'в очереди'}
            dim={!delivery.courierName}
        />
        {delivery.windowStart && delivery.windowEnd && (
            <DetailRow
                label="Окно"
                value={`${fmtDateTime(delivery.windowStart)} – ${fmtTime(new Date(delivery.windowEnd))}`}
            />
        )}
        <DetailRow
            label="Взять у двери"
            value={fmtMoney(delivery.cashDue, delivery.currency)}
            strong={delivery.cashDue > 0}
        />
    </>
);
