import { PersonCell } from '@/shared/components/common';
import type { Currency } from '@/shared/constants/currency';
import { fmtDate, fmtDateFull } from '@/shared/format/date';
import { fmtMoney } from '@/shared/format/money';
import { clientDisplayName } from '@/shared/format/name';
import type { ClientView } from '@/contexts/client';
import { createColumnHelper } from '@tanstack/react-table';

const { accessor } = createColumnHelper<ClientView>();

export const COLUMNS = (currency: Currency) => [
    accessor('firstName', {
        header: 'Клиент',
        cell: ({ row: { original } }) => (
            <PersonCell
                name={clientDisplayName(original)}
                caption={[original.phone, original.email].filter(Boolean).join(' · ')}
            />
        ),
    }),
    accessor('totalOrders', {
        header: 'Заказов',
    }),
    accessor('totalSpentAmount', {
        header: 'Потрачено',
        cell: ({ getValue }) => (getValue() > 0 ? fmtMoney(getValue(), currency) : '—'),
    }),
    accessor('lastVisitAt', {
        header: 'Последняя покупка',
        cell: ({ row: { original } }) =>
            original.lastVisitAt ? fmtDateFull(original.lastVisitAt) : '—',
    }),
    accessor('createdAt', {
        header: 'Регистрация',
        cell: ({ getValue }) => fmtDate(getValue()),
    }),
];
