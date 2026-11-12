'use client';

import { type SubmitHandler, useForm } from 'react-hook-form';
import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import type { StockLevelView } from '@/contexts/stockMovement';
import type { WarehouseView } from '@/contexts/warehouse';
import { zodResolver } from '@hookform/resolvers/zod';
import type { StockOperationFormValues } from '../form/formData';
import {
    STOCK_OPERATION_SCHEMA,
    STOCK_OPERATION_TEXT,
    StockOperationType,
} from '../lib/stockOperation';
import { useStockOperation } from './useStockOperation';

export const useStockOperationSheet = ({
    projectId,
    type,
    row,
    warehouses,
}: {
    projectId: string;
    type: StockOperationType;
    row: Pick<
        StockLevelView,
        'productId' | 'variantId' | 'name' | 'byWarehouse'
    >;
    warehouses: WarehouseView[];
}) => {
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
            quantity:
                type === StockOperationType.COUNT
                    ? (row.byWarehouse[warehouseId] ?? 0)
                    : 1,
            note: '',
            costAmount: null,
        },
        resolver: zodResolver(STOCK_OPERATION_SCHEMA[type]),
        mode: 'onChange',
    });

    const onSubmit: SubmitHandler<StockOperationFormValues> = async (
        values,
    ) => {
        const { success } = await runAction(mutateAsync(values), {
            success: `${text.success}: «${row.name}»`,
        });

        if (success) close();
    };

    return { isPending, text, form, onSubmit };
};
