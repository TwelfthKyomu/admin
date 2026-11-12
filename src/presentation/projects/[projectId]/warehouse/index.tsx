'use client';

import { CreateButton, PageHeader, QueryBoundary } from '@/shared/components/common';
import { warehouseNamesById } from '@/contexts/warehouse';
import { Table } from '@/ui/Base';
import { OVERVIEW_COLUMNS } from './components/Column';
import { MOVEMENT_COLUMNS } from './components/MovementColumn';
import { Section } from './components/Section';
import { WAREHOUSE_COLUMNS } from './components/WarehouseColumn';
import { useWarehousePage } from './hooks/useWarehousePage';
import { productNames } from './lib/names';

export const WarehousePage = () => {
    const {
        projectId,
        warehousesQuery,
        overviewQuery,
        movementsQuery,
        isDeleting,
        onOperation,
        onTransfer,
        onCreateWarehouse,
        onEditWarehouse,
        onMakePrimary,
        onDeleteWarehouse,
    } = useWarehousePage();

    return (
        <>
            <PageHeader
                title="Склады"
                description="Где лежит товар. Основной склад подставляется в продажу и приёмку, покупатели на сайте видят остаток складов с отметкой «Продаётся»."
                actions={
                    <CreateButton
                        label="Склад"
                        onClick={onCreateWarehouse}
                    />
                }
            />
            <QueryBoundary
                query={warehousesQuery}
                errorTitle="Не удалось загрузить склады"
            >
                {(warehouses) => (
                    <div className="grid grid-cols-1 gap-6">
                        <Table
                            columns={WAREHOUSE_COLUMNS({
                                onEdit: onEditWarehouse,
                                onMakePrimary,
                                onDelete: onDeleteWarehouse,
                                isDeleting,
                            })}
                            data={warehouses}
                            getRowId={(warehouse) => warehouse.id}
                            onRowClick={(row) => onEditWarehouse(row.original)}
                        />
                        <QueryBoundary
                            query={overviewQuery}
                            errorTitle="Не удалось загрузить остатки"
                        >
                            {(rows) => (
                                <>
                                    <Section title="Остатки">
                                        <Table
                                            columns={OVERVIEW_COLUMNS({
                                                warehouses,
                                                onOperation,
                                                onTransfer,
                                            })}
                                            data={rows}
                                            emptyMessage="В проекте пока нет товаров."
                                            getRowId={(row) => row.id}
                                            enableColumnPinning
                                            initialColumnPinning={{ right: ['actions'] }}
                                        />
                                    </Section>
                                    <Section title="История движений">
                                        <QueryBoundary
                                            query={movementsQuery}
                                            errorTitle="Не удалось загрузить историю движений"
                                        >
                                            {(movements) => (
                                                <Table
                                                    columns={MOVEMENT_COLUMNS({
                                                        projectId,
                                                        productNames: productNames(rows),
                                                        warehouseNames:
                                                            warehouseNamesById(warehouses),
                                                    })}
                                                    data={movements}
                                                    emptyMessage="Движений по складу пока нет."
                                                    getRowId={(movement) => movement.id}
                                                />
                                            )}
                                        </QueryBoundary>
                                    </Section>
                                </>
                            )}
                        </QueryBoundary>
                    </div>
                )}
            </QueryBoundary>
        </>
    );
};
