'use client';

import { CreateButton, QueryBoundary } from '@/shared/components/common';
import { Table } from '@/ui/Base';
import { COLUMNS } from './components/Column';
import { useLooksPage } from './hooks/useLooksPage';

export const LooksPage = () => {
    const { query, onCreate, onEdit, onDelete, isDeleting } = useLooksPage();

    return (
        <QueryBoundary
            query={query}
            errorTitle="Не удалось загрузить образы"
        >
            {(looks) => (
                <Table
                    columns={COLUMNS({ onEdit, onDelete, isDeleting })}
                    showToolbar
                    customActions={
                        <CreateButton
                            label="Образ"
                            onClick={onCreate}
                        />
                    }
                    data={looks}
                    emptyMessage="Образов пока нет. Загрузите фото, отметьте на нём товары — на сайте их можно будет купить одним нажатием."
                    getRowId={(look) => look.id}
                />
            )}
        </QueryBoundary>
    );
};
