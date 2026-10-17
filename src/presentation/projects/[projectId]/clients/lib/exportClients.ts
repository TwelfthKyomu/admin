import { fmtDate } from '@/shared/format/date';
import { csvAmount, downloadCsv } from '@/shared/lib/csv';
import type { ClientView } from '@/contexts/client';

export function exportClients(clients: ClientView[]): void {
    downloadCsv(
        `clients-${new Date().toISOString().slice(0, 10)}.csv`,
        [
            'Фамилия',
            'Имя',
            'Отчество',
            'Телефон',
            'Email',
            'Заказов',
            'Потрачено',
            'Последняя покупка',
            'Регистрация',
        ],
        clients.map((client) => [
            client.lastName,
            client.firstName,
            client.middleName,
            client.phone,
            client.email,
            client.totalOrders,
            csvAmount(client.totalSpentAmount),
            client.lastVisitAt ? fmtDate(client.lastVisitAt) : '',
            fmtDate(client.createdAt),
        ]),
    );
}
