'use client';

import { CreateButton, QueryBoundary } from '@/shared/components/common';
import { CLIENTS_LIST_LIMIT } from '@/contexts/client';
import { Button, Input, Table } from '@/ui/Base';
import { Download } from 'lucide-react';
import { COLUMNS } from './components/Column';
import { useClientsPage } from './hooks/useClientsPage';
import { exportClients } from './lib/exportClients';

export const ClientsPage = () => {
    const { query, search, setSearch, currency, canCreate, onCreate, onEdit } = useClientsPage();

    return (
        <>
            <div className="mb-3 flex flex-wrap items-center gap-2">
                <Input
                    className="max-w-xs"
                    placeholder="Поиск по имени, телефону или email…"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                />
                <div className="ml-auto flex items-center gap-2">
                    <Button
                        variant="ghost"
                        disabled={!query.data?.length}
                        onClick={() => exportClients(query.data ?? [])}
                    >
                        <Download />
                        CSV
                    </Button>
                    {canCreate && (
                        <CreateButton
                            label="Клиент"
                            onClick={onCreate}
                        />
                    )}
                </div>
            </div>
            <QueryBoundary
                query={query}
                errorTitle="Не удалось загрузить клиентов"
            >
                {(clients) => (
                    <>
                        <Table
                            columns={COLUMNS(currency)}
                            data={clients}
                            emptyMessage={
                                search ? 'По запросу никого не нашлось.' : 'Клиентов пока нет.'
                            }
                            getRowId={(client) => client.id}
                            onRowClick={onEdit ? (row) => onEdit(row.original) : undefined}
                            rowClassName={onEdit ? 'cursor-pointer' : undefined}
                        />
                        {clients.length >= CLIENTS_LIST_LIMIT && (
                            <p className="mt-2 text-muted-foreground text-xs">
                                Показаны последние {CLIENTS_LIST_LIMIT} клиентов — воспользуйтесь
                                поиском, чтобы найти остальных.
                            </p>
                        )}
                    </>
                )}
            </QueryBoundary>
        </>
    );
};
