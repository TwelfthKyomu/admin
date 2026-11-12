'use client';

import { FormDialog } from '@/shared/components/common';
import type { StockLevelView } from '@/contexts/stockMovement';
import type { WarehouseView } from '@/contexts/warehouse';
import { Input, Select } from '@/ui/Controlled';
import { useStockTransferSheet } from '../hooks/useStockTransferSheet';

interface StockTransferSheetProps {
    projectId: string;
    row: Pick<StockLevelView, 'productId' | 'variantId' | 'name'>;
    warehouses: WarehouseView[];
}

export const StockTransferSheet = ({ projectId, row, warehouses }: StockTransferSheetProps) => {
    const { isPending, options, form, onSubmit } = useStockTransferSheet({
        projectId,
        row,
        warehouses,
    });

    return (
        <FormDialog
            surface="sheet"
            title="Перемещение"
            description={`Товар «${row.name}».`}
            form={form}
            onSubmit={onSubmit}
            submitLabel="Переместить"
            requireDirty={false}
            busy={isPending}
        >
            <Select
                name="warehouseId"
                label="Откуда"
                options={options}
            />
            <Select
                name="toWarehouseId"
                label="Куда"
                options={options}
            />
            <Input
                name="quantity"
                label="Сколько"
                type="number"
                min="1"
                step="1"
            />
            <Input
                name="note"
                label="Комментарий"
            />
        </FormDialog>
    );
};
