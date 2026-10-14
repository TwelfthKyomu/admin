'use client';

import { CreateButton, QueryBoundary } from '@/shared/components/common';
import { Table } from '@/ui/Base';
import { COLUMNS } from './components/Column';
import { useBadgesPage } from './hooks/useBadgesPage';

export const BadgesPage = () => {
    const { query, onCreate, onEdit, onDelete, isDeleting } = useBadgesPage();

    return (
        <QueryBoundary
            query={query}
            errorTitle="Не удалось загрузить бейджи"
        >
            {(badges) => (
                <Table
                    columns={COLUMNS({ onEdit, onDelete, isDeleting })}
                    customActions={<CreateButton onClick={onCreate} />}
                    data={badges}
                    emptyMessage="Бейджей пока нет. Добавьте «Sale», «Хит», «Лимит» — что нужно вашему магазину."
                    getRowId={(badge) => badge.id}
                />
            )}
        </QueryBoundary>
    );
};
