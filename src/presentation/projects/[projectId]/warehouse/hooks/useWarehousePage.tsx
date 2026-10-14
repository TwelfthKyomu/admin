'use client';

import { useProject } from '@/app/providers';
import { modal } from '@/shared/lib/modal';
import { type StockLevelView, useStockMovements, useStockOverview } from '@/contexts/stockMovement';
import dynamic from 'next/dynamic';

const StockAdjustSheet = dynamic(() =>
    import('../modal/StockAdjustSheet').then((m) => m.StockAdjustSheet),
);

export function useWarehousePage() {
    const { projectId } = useProject();
    const overviewQuery = useStockOverview(projectId);
    const movementsQuery = useStockMovements({ projectId });

    const onAdjust = (row: StockLevelView) =>
        modal.open(
            <StockAdjustSheet
                projectId={projectId}
                product={row}
            />,
        );

    return { overviewQuery, movementsQuery, onAdjust };
}
