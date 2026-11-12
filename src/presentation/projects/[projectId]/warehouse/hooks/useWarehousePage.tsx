'use client';

import { useProject } from '@/app/providers';
import { runAction } from '@/shared/lib/action-result';
import { confirmDestructive, modal } from '@/shared/lib/modal';
import { type StockLevelView, useStockMovements, useStockOverview } from '@/contexts/stockMovement';
import {
    useDeleteWarehouse,
    useMakePrimaryWarehouse,
    useWarehousesList,
    type WarehouseView,
} from '@/contexts/warehouse';
import dynamic from 'next/dynamic';
import type { StockOperationType } from '../lib/stockOperation';

const StockOperationSheet = dynamic(() =>
    import('../modal/StockOperationSheet').then((m) => m.StockOperationSheet),
);

const StockTransferSheet = dynamic(() =>
    import('../modal/StockTransferSheet').then((m) => m.StockTransferSheet),
);

const WarehouseCreateModal = dynamic(() =>
    import('../modal/WarehouseCreateModal').then((m) => m.WarehouseCreateModal),
);

const WarehouseEditSheet = dynamic(() =>
    import('../modal/WarehouseEditSheet').then((m) => m.WarehouseEditSheet),
);

export const useWarehousePage = () => {
    const { projectId } = useProject();
    const warehousesQuery = useWarehousesList(projectId);
    const overviewQuery = useStockOverview(projectId);
    const movementsQuery = useStockMovements({ projectId });
    const { mutateAsync: deleteWarehouse, isPending: isDeleting } = useDeleteWarehouse();
    const { mutateAsync: makePrimary } = useMakePrimaryWarehouse();
    const warehouses = warehousesQuery.data ?? [];

    const onOperation = (type: StockOperationType, row: StockLevelView) =>
        modal.open(
            <StockOperationSheet
                projectId={projectId}
                type={type}
                row={row}
                warehouses={warehouses}
            />,
        );

    const onTransfer = (row: StockLevelView) =>
        modal.open(
            <StockTransferSheet
                projectId={projectId}
                row={row}
                warehouses={warehouses}
            />,
        );

    const onCreateWarehouse = () => modal.open(<WarehouseCreateModal projectId={projectId} />);

    const onEditWarehouse = (warehouse: WarehouseView) =>
        modal.open(
            <WarehouseEditSheet
                projectId={projectId}
                warehouse={warehouse}
            />,
        );

    const onMakePrimary = (warehouse: WarehouseView) =>
        runAction(makePrimary({ id: warehouse.id, projectId }), {
            success: `Склад «${warehouse.name}» теперь основной`,
        });

    const onDeleteWarehouse = (warehouse: WarehouseView) =>
        confirmDestructive({
            title: 'Удалить склад?',
            description: (
                <>
                    Склад <strong>«{warehouse.name}»</strong> пропадёт из списка. Удалить можно
                    только пустой склад без броней.
                </>
            ),
            success: `Склад «${warehouse.name}» удалён`,
            onConfirm: () => deleteWarehouse({ id: warehouse.id, projectId }),
        });

    return {
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
    };
};
