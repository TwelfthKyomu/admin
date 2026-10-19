import { PersonCell } from '@/shared/components/common';
import type { Currency } from '@/shared/constants/currency';
import { fmtMoney } from '@/shared/format/money';
import type { CourierStatsView } from '@/contexts/delivery';
import type { EmployeeRevenueView } from '@/contexts/order';
import { createColumnHelper } from '@tanstack/react-table';

const sellers = createColumnHelper<EmployeeRevenueView>();

export const SELLER_COLUMNS = (currency: Currency, total: number) => [
    sellers.display({
        id: 'employee',
        header: 'Продавец',
        cell: ({ row: { original } }) => <PersonCell name={original.employeeName} />,
    }),
    sellers.display({
        id: 'share',
        header: 'Доля выручки',
        cell: ({ row: { original } }) => {
            const share = total > 0 ? Math.round((original.revenueAmount / total) * 100) : 0;

            return (
                <div className="flex min-w-48 items-center gap-2.5">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                            className="h-2 rounded-full bg-primary"
                            style={{ width: `${share}%` }}
                        />
                    </div>
                    <span className="w-9 text-right text-muted-foreground tabular-nums">
                        {share}%
                    </span>
                </div>
            );
        },
    }),
    sellers.accessor('ordersCount', {
        header: 'Заказов',
    }),
    sellers.accessor('revenueAmount', {
        header: 'Выручка',
        cell: ({ getValue }) => fmtMoney(getValue(), currency),
    }),
    sellers.display({
        id: 'average',
        header: 'Средний чек',
        cell: ({ row: { original } }) =>
            original.ordersCount > 0
                ? fmtMoney(Math.round(original.revenueAmount / original.ordersCount), currency)
                : '—',
    }),
];

const couriers = createColumnHelper<CourierStatsView>();

export const COURIER_COLUMNS = (currency: Currency) => [
    couriers.display({
        id: 'courier',
        header: 'Курьер',
        cell: ({ row: { original } }) => <PersonCell name={original.name} />,
    }),
    couriers.accessor('delivered', { header: 'Доставлено' }),
    couriers.accessor('failed', { header: 'Не доставлено' }),
    couriers.display({
        id: 'rate',
        header: 'Успешность',
        cell: ({ row: { original } }) => {
            const total = original.delivered + original.failed;

            return total > 0 ? `${Math.round((original.delivered / total) * 100)}%` : '—';
        },
    }),
    couriers.accessor('collected', {
        header: 'Принято у двери',
        cell: ({ getValue }) => fmtMoney(getValue(), currency),
    }),
    couriers.accessor('handedOver', {
        header: 'Сдано в кассу',
        cell: ({ getValue }) => fmtMoney(getValue(), currency),
    }),
    couriers.accessor('onHand', {
        header: 'На руках',
        cell: ({ getValue }) => fmtMoney(getValue(), currency),
    }),
];
