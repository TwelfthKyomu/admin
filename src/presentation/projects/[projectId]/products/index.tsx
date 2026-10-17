'use client';

import { CreateButton, QueryBoundary } from '@/shared/components/common';
import { Button, Input, Table } from '@/ui/Base';
import { COLUMNS } from './components/Column';
import { useProductsPage } from './hooks/useProductsPage';

export const ProductsPage = () => {
    const { query, search, setSearch, onCreate, onEdit, onDelete, onBulkDelete, isDeleting } =
        useProductsPage();

    return (
        <>
            <div className="mb-3 flex flex-wrap items-center gap-2">
                <Input
                    className="max-w-xs"
                    placeholder="Поиск по названию или артикулу…"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                />
                <div className="ml-auto">
                    <CreateButton
                        label="Товар"
                        onClick={onCreate}
                    />
                </div>
            </div>
            <QueryBoundary
                query={query}
                errorTitle="Не удалось загрузить товары"
            >
                {(products) => (
                    <Table
                        columns={COLUMNS({ onEdit, onDelete, isDeleting })}
                        data={products}
                        emptyMessage={
                            search
                                ? 'По запросу ничего не нашлось.'
                                : 'Товаров пока нет. Добавьте первый.'
                        }
                        enableRowSelection
                        getRowId={(product) => product.id}
                        bulkActions={(rows) => (
                            <Button
                                size="sm"
                                variant="destructive"
                                disabled={isDeleting}
                                onClick={() => onBulkDelete(rows)}
                            >
                                Удалить выбранные
                            </Button>
                        )}
                    />
                )}
            </QueryBoundary>
        </>
    );
};
