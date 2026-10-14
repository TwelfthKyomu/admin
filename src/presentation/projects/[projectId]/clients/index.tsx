'use client';

import { CreateButton, QueryBoundary } from '@/shared/components/common';
import { Table } from '@/ui/Base';
import { COLUMNS } from './components/Column';
import { useClientsPage } from './hooks/useClientsPage';

export const ClientsPage = () => {
    const { query, currency, canCreate, onCreate, onEdit } = useClientsPage();

    return (
        <QueryBoundary
            query={query}
            errorTitle="Не удалось загрузить клиентов"
        >
            {(clients) => (
                <Table
                    columns={COLUMNS(currency)}
                    customActions={canCreate ? <CreateButton onClick={onCreate} /> : undefined}
                    data={clients}
                    emptyMessage="Клиентов пока нет."
                    getRowId={(client) => client.id}
                    onRowClick={onEdit ? (row) => onEdit(row.original) : undefined}
                    rowClassName={onEdit ? 'cursor-pointer' : undefined}
                />
            )}
        </QueryBoundary>
    );
};
