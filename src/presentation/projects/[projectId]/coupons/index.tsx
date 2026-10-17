'use client';

import { CreateButton, QueryBoundary } from '@/shared/components/common';
import { Table } from '@/ui/Base';
import { COLUMNS } from './components/Column';
import { useCouponsPage } from './hooks/useCouponsPage';

export const CouponsPage = () => {
    const { query, currency, onCreate, onEdit, onDelete, isDeleting } = useCouponsPage();

    return (
        <QueryBoundary
            query={query}
            errorTitle="Не удалось загрузить купоны"
        >
            {(coupons) => (
                <Table
                    columns={COLUMNS({ currency, onEdit, onDelete, isDeleting })}
                    showToolbar
                    customActions={
                        <CreateButton
                            label="Купон"
                            onClick={onCreate}
                        />
                    }
                    data={coupons}
                    emptyMessage="Купонов пока нет. Создайте первый."
                    getRowId={(coupon) => coupon.id}
                />
            )}
        </QueryBoundary>
    );
};
