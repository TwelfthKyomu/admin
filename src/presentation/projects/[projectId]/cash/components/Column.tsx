import { PersonCell } from '@/shared/components/common';
import type { Currency } from '@/shared/constants/currency';
import { fmtMoney } from '@/shared/format/money';
import type { CourierBalanceView } from '@/contexts/cashShift';
import { Button } from '@/ui/Base';
import { createColumnHelper } from '@tanstack/react-table';

const { display } = createColumnHelper<CourierBalanceView>();

interface CourierColumnsProps {
    currency: Currency;
    canAccept: boolean;
    onAccept: (courier: CourierBalanceView) => void;
}

export const COURIER_COLUMNS = ({ currency, canAccept, onAccept }: CourierColumnsProps) => [
    display({
        id: 'courier',
        header: 'Курьер',
        cell: ({ row: { original } }) => <PersonCell name={original.name} />,
    }),
    display({
        id: 'collected',
        header: 'Принял у двери',
        cell: ({ row: { original } }) => fmtMoney(original.collected - original.refunded, currency),
    }),
    display({
        id: 'handed',
        header: 'Сдал',
        cell: ({ row: { original } }) => fmtMoney(original.handedOver, currency),
    }),
    display({
        id: 'onHand',
        header: 'На руках',
        cell: ({ row: { original } }) => fmtMoney(original.onHand, currency),
    }),
    display({
        id: 'actions',
        header: '',
        cell: ({ row: { original } }) =>
            canAccept && original.onHand > 0 ? (
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAccept(original)}
                >
                    Принять
                </Button>
            ) : null,
    }),
];
