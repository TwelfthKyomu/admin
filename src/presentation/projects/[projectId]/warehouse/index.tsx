'use client';

import { QueryBoundary } from '@/shared/components/common';
import { Table } from '@/ui/Base';
import { MOVEMENT_COLUMNS, OVERVIEW_COLUMNS } from './components/Column';
import { useWarehousePage } from './hooks/useWarehousePage';

export const WarehousePage = () => {
    const { overviewQuery, movementsQuery, onAdjust } = useWarehousePage();

    return (
        <>
            <QueryBoundary
                query={overviewQuery}
                errorTitle="Не удалось загрузить остатки"
            >
                {(rows) => (
                    <Table
                        columns={OVERVIEW_COLUMNS({ onAdjust })}
                        data={rows}
                        emptyMessage="В проекте пока нет товаров."
                        getRowId={(row) => row.id}
                    />
                )}
            </QueryBoundary>
            <h3>История движений</h3>
            <QueryBoundary
                query={movementsQuery}
                errorTitle="Не удалось загрузить историю движений"
            >
                {(movements) => (
                    <Table
                        columns={MOVEMENT_COLUMNS}
                        data={movements}
                        emptyMessage="Движений по складу пока нет."
                        getRowId={(movement) => movement.id}
                    />
                )}
            </QueryBoundary>
        </>
    );
};
