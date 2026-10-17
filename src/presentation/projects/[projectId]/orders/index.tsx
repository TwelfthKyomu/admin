'use client';

import { QueryBoundary } from '@/shared/components/common';
import { ORDERS_LIST_LIMIT } from '@/contexts/order';
import { Button, Input, Table } from '@/ui/Base';
import { Download, Plus } from 'lucide-react';
import { COLUMNS } from './components/Column';
import { StatusFilter } from './components/StatusFilter';
import { useOrdersPage } from './hooks/useOrdersPage';
import { exportOrders } from './lib/exportOrders';

export const OrdersPage = () => {
    const { query, search, setSearch, status, setStatus, onOpen, canCreateSale, onCreateSale } =
        useOrdersPage();

    return (
        <>
            <div className="mb-3 flex flex-wrap items-center gap-2">
                <Input
                    className="max-w-xs"
                    placeholder="Поиск по №, клиенту или телефону…"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                />
                <StatusFilter
                    value={status}
                    onChange={setStatus}
                />
                <div className="ml-auto flex items-center gap-2">
                    <Button
                        variant="ghost"
                        disabled={!query.data?.length}
                        onClick={() => exportOrders(query.data ?? [])}
                    >
                        <Download />
                        CSV
                    </Button>
                    {canCreateSale && (
                        <Button
                            variant="outline"
                            onClick={onCreateSale}
                        >
                            <Plus />
                            Продажа
                        </Button>
                    )}
                </div>
            </div>
            <QueryBoundary
                query={query}
                errorTitle="Не удалось загрузить заказы"
            >
                {(orders) => (
                    <>
                        <Table
                            columns={COLUMNS}
                            data={orders}
                            emptyMessage={
                                search || status !== 'all'
                                    ? 'Под фильтр не подошёл ни один заказ.'
                                    : 'Заказов пока нет.'
                            }
                            getRowId={(order) => order.id}
                            onRowClick={(row) => onOpen(row.original.id)}
                            rowClassName="cursor-pointer"
                        />
                        {orders.length >= ORDERS_LIST_LIMIT && (
                            <p className="mt-2 text-muted-foreground text-xs">
                                Показаны последние {ORDERS_LIST_LIMIT} заказов — уточните поиск или
                                фильтр, чтобы найти более ранние.
                            </p>
                        )}
                    </>
                )}
            </QueryBoundary>
        </>
    );
};
