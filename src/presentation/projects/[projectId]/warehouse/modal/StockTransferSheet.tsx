'use client';

import { type SubmitHandler, useForm } from 'react-hook-form';
import { FormDialog } from '@/shared/components/common';
import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import {
    type StockLevelView,
    TransferStockActionInputSchema,
    useTransferStock,
} from '@/contexts/stockMovement';
import type { WarehouseView } from '@/contexts/warehouse';
import { Input, Select } from '@/ui/Controlled';
import { zodResolver } from '@hookform/resolvers/zod';
import type { StockTransferFormValues } from '../form/formData';
import { warehouseOptions } from '../lib/stockOperation';

interface StockTransferSheetProps {
    projectId: string;
    row: Pick<StockLevelView, 'productId' | 'variantId' | 'name'>;
    warehouses: WarehouseView[];
}

export const StockTransferSheet = ({ projectId, row, warehouses }: StockTransferSheetProps) => {
    const close = useModalClose();
    const { mutateAsync, isPending } = useTransferStock();
    const options = warehouseOptions(warehouses);

    const form = useForm<StockTransferFormValues>({
        defaultValues: {
            projectId,
            productId: row.productId,
            variantId: row.variantId ?? null,
            warehouseId: warehouses[0]?.id ?? '',
            toWarehouseId: warehouses[1]?.id ?? '',
            quantity: 1,
            note: '',
        },
        resolver: zodResolver(TransferStockActionInputSchema),
        mode: 'onChange',
    });

    const onSubmit: SubmitHandler<StockTransferFormValues> = async (values) => {
        const { success } = await runAction(mutateAsync(values), {
            success: `«${row.name}» перемещён`,
        });

        if (success) close();
    };

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
