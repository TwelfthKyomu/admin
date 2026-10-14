import { DELIVERY_CARRIER_LABEL } from '@/shared/labels/delivery';
import { type DeliveryView, deliveryTrackUrl } from '@/contexts/delivery';
import { DetailRow } from '../DetailRow';

export const CarrierDetails = ({ delivery }: { delivery: DeliveryView }) => (
    <>
        {delivery.carrier && (
            <DetailRow
                label="Служба"
                value={DELIVERY_CARRIER_LABEL[delivery.carrier]}
            />
        )}
        {delivery.trackingNumber && (
            <DetailRow
                label="Трек"
                value={delivery.trackingNumber}
                mono
                url={deliveryTrackUrl(delivery)}
            />
        )}
    </>
);
