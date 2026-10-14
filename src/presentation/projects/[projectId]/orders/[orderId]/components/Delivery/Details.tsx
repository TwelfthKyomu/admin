import { fmtDateFull } from '@/shared/format/date';
import { DELIVERY_KIND_LABEL } from '@/shared/labels/delivery';
import { DeliveryKind, DeliveryStatus, type DeliveryView } from '@/contexts/delivery';
import { DetailRow } from '../DetailRow';
import { CarrierDetails } from './CarrierDetails';
import { CourierDetails } from './CourierDetails';

export const DeliveryDetails = ({ delivery }: { delivery: DeliveryView }) => {
    const isCourier = delivery.kind === DeliveryKind.COURIER;
    const recipient = [delivery.recipientName, delivery.recipientPhone].filter(Boolean).join(', ');

    return (
        <div className="grid gap-1.5 px-4 py-3 text-[13px]">
            <DetailRow
                label="Способ"
                value={DELIVERY_KIND_LABEL[delivery.kind]}
            />
            {isCourier && <CourierDetails delivery={delivery} />}
            {!isCourier && <CarrierDetails delivery={delivery} />}
            {delivery.address && (
                <DetailRow
                    label="Адрес"
                    value={delivery.address}
                />
            )}
            {recipient && (
                <DetailRow
                    label="Получатель"
                    value={recipient}
                />
            )}
            {delivery.failureReason && delivery.status === DeliveryStatus.FAILED && (
                <DetailRow
                    label="Причина"
                    value={delivery.failureReason}
                />
            )}
            {isCourier && delivery.assignedAt && (
                <DetailRow
                    label="Назначен курьер"
                    value={fmtDateFull(delivery.assignedAt)}
                    dim
                />
            )}
            {delivery.pickedUpAt && (
                <DetailRow
                    label={isCourier ? 'Забрал' : 'Отправлено'}
                    value={fmtDateFull(delivery.pickedUpAt)}
                    dim
                />
            )}
            {delivery.deliveredAt && (
                <DetailRow
                    label="Доставлено"
                    value={fmtDateFull(delivery.deliveredAt)}
                    dim
                />
            )}
            {delivery.failedAt && (
                <DetailRow
                    label="Не доставлено"
                    value={fmtDateFull(delivery.failedAt)}
                    dim
                />
            )}
            {delivery.cancelledAt && (
                <DetailRow
                    label="Отменена"
                    value={fmtDateFull(delivery.cancelledAt)}
                    dim
                />
            )}
        </div>
    );
};
