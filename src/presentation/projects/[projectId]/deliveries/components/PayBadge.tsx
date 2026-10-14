import { fmtMoney } from '@/shared/format/money';
import { DeliveryStatus, type DeliveryView } from '@/contexts/delivery';

export const PayBadge = ({ delivery }: { delivery: DeliveryView }) => {
    if (delivery.status === DeliveryStatus.DELIVERED) {
        return (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-[12px] font-medium text-green-800">
                Доставлено
            </span>
        );
    }

    if (delivery.cashDue > 0) {
        return (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[12px] font-medium text-amber-900">
                {fmtMoney(delivery.cashDue, delivery.currency)} у двери
            </span>
        );
    }

    return (
        <span className="rounded-full bg-green-100 px-2 py-0.5 text-[12px] font-medium text-green-800">
            Оплачено
        </span>
    );
};
