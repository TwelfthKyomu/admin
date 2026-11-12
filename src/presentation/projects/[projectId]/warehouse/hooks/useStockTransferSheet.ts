'use client';

import { type SubmitHandler, useForm } from 'react-hook-form';
import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import {
    type StockLevelView,
    TransferStockActionInputSchema,
    useTransferStock,
} from '@/contexts/stockMovement';
import type { WarehouseView } from '@/contexts/warehouse';
import { zodResolver } from '@hookform/resolvers/zod';
import type { StockTransferFormValues } from '../form/formData';
import { warehouseOptions } from '../lib/stockOperation';

export const useStockTransferSheet = ({
    projectId,
    row,
    warehouses,
}: {
    projectId: string;
    row: Pick<StockLevelView, 'productId' | 'variantId' | 'name'>;
    warehouses: WarehouseView[];
}) => {
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

    return { isPending, options, form, onSubmit };
};
