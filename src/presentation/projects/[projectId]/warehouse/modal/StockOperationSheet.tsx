'use client';

import { type SubmitHandler, useForm } from 'react-hook-form';
import { FormDialog } from '@/shared/components/common';
import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import type { StockLevelView } from '@/contexts/stockMovement';
import type { WarehouseView } from '@/contexts/warehouse';
import { Input, Select } from '@/ui/Controlled';
import { zodResolver } from '@hookform/resolvers/zod';
import type { StockOperationFormValues } from '../form/formData';
import { useStockOperation } from '../hooks/useStockOperation';
import {
    STOCK_OPERATION_SCHEMA,
    STOCK_OPERATION_TEXT,
    StockOperationType,
    warehouseOptions,
} from '../lib/stockOperation';

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
    const close = useModalClose();
    const { mutateAsync, isPending } = useStockOperation(type);
    const text = STOCK_OPERATION_TEXT[type];
    const warehouseId = warehouses[0]?.id ?? '';

    const form = useForm<StockOperationFormValues>({
        defaultValues: {
            projectId,
            productId: row.productId,
            variantId: row.variantId ?? null,
            warehouseId,
            quantity: type === StockOperationType.COUNT ? (row.byWarehouse[warehouseId] ?? 0) : 1,
            note: '',
        },
        resolver: zodResolver(STOCK_OPERATION_SCHEMA[type]),
        mode: 'onChange',
    });

    const onSubmit: SubmitHandler<StockOperationFormValues> = async (values) => {
        const { success } = await runAction(mutateAsync(values), {
            success: `${text.success}: «${row.name}»`,
        });

        if (success) close();
    };

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
            <Input
                name="note"
                label="Комментарий"
                placeholder="Напр. поставщик, номер накладной, причина"
            />
        </FormDialog>
    );
};
