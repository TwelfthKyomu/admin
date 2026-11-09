'use client';

import { CreateButton, QueryBoundary } from '@/shared/components/common';
import { Button, Input, Table } from '@/ui/Base';
import { Upload } from 'lucide-react';
import { COLUMNS } from './components/Column';
import { useProductsPage } from './hooks/useProductsPage';

export const ProductsPage = () => {
    const {
        query,
        search,
        setSearch,
        onCreate,
        onImport,
        onEdit,
        onDelete,
        onBulkDelete,
        isDeleting,
    } = useProductsPage();

    return (
        <>
            <div className="mb-3 flex flex-wrap items-center gap-2">
                <Input
                    className="max-w-xs"
                    placeholder="Название, артикул или штрихкод…"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                />
                <div className="ml-auto flex gap-2">
                    <Button
                        variant="outline"
                        onClick={onImport}
                    >
                        <Upload />
                        Импорт
                    </Button>
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
