'use client';

import { CreateButton, QueryBoundary } from '@/shared/components/common';
import { Table } from '@/ui/Base';
import { COLUMNS } from './components/Column';
import { useCategoriesPage } from './hooks/useCategoriesPage';

export const CategoriesPage = () => {
    const { query, onCreate, onEdit, onDelete, isDeleting } = useCategoriesPage();

    return (
        <QueryBoundary
            query={query}
            errorTitle="Не удалось загрузить категории"
        >
            {(categories) => (
                <Table
                    columns={COLUMNS({ onEdit, onDelete, isDeleting })}
                    showToolbar
                    customActions={
                        <CreateButton
                            label="Категория"
                            onClick={onCreate}
                        />
                    }
                    data={categories}
                    emptyMessage="Категорий пока нет. Добавьте первую."
                    getRowId={(category) => category.id}
                />
            )}
        </QueryBoundary>
    );
};
