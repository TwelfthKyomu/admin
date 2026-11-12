'use client';

import { FormDialog } from '@/shared/components/common';
import type { StockLevelView } from '@/contexts/stockMovement';
import type { WarehouseView } from '@/contexts/warehouse';
import { Input, Money, Select } from '@/ui/Controlled';
import { useStockOperationSheet } from '../hooks/useStockOperationSheet';
import { StockOperationType, warehouseOptions } from '../lib/stockOperation';

interface StockOperationSheetProps {
    projectId: string;
    type: StockOperationType;
    row: Pick<StockLevelView, 'productId' | 'variantId' | 'name' | 'byWarehouse'>;
    warehouses: WarehouseView[];
}

export const StockOperationSheet = ({
    projectId,
    type,
    row,
    warehouses,
}: StockOperationSheetProps) => {
    const { isPending, text, form, onSubmit } = useStockOperationSheet({
        projectId,
        type,
        row,
        warehouses,
    });

    return (
        <FormDialog
            surface="sheet"
            title={text.title}
            description={`Товар «${row.name}».`}
            form={form}
            onSubmit={onSubmit}
            submitLabel={text.submitLabel}
            requireDirty={false}
            busy={isPending}
        >
            <Select
                name="warehouseId"
                label="Склад"
                options={warehouseOptions(warehouses)}
            />
            <Input
                name="quantity"
                label={text.quantityLabel}
                type="number"
                min="0"
                step="1"
            />
            {type === StockOperationType.RECEIPT && (
                <Money
                    name="costAmount"
                    label="Закупочная цена за штуку"
                    placeholder="Не менять"
                    description="Закупочная цена товара станет средней по всему остатку."
                />
            )}
            <Input
                name="note"
                label="Комментарий"
                placeholder="Напр. поставщик, номер накладной, причина"
            />
        </FormDialog>
    );
};
