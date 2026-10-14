'use client';

import { type SubmitHandler, useForm } from 'react-hook-form';
import { FormDialog } from '@/shared/components/common';
import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import {
    AdjustStockActionInputSchema,
    type StockLevelView,
    useAdjustStock,
} from '@/contexts/stockMovement';
import { Input } from '@/ui/Controlled';
import { zodResolver } from '@hookform/resolvers/zod';
import type { AdjustStockFormValues } from '../form/formData';

interface AdjustStockSheetProps {
    projectId: string;
    product: Pick<StockLevelView, 'productId' | 'variantId' | 'name' | 'stock'>;
}

export const StockAdjustSheet = ({ projectId, product }: AdjustStockSheetProps) => {
    const close = useModalClose();
    const { mutateAsync, isPending } = useAdjustStock(projectId);

    const form = useForm<AdjustStockFormValues>({
        values: {
            projectId,
            productId: product.productId,
            variantId: product.variantId,
            stock: product.stock ?? null,
            note: '',
        },
        resolver: zodResolver(AdjustStockActionInputSchema),
        mode: 'onChange',
    });

    const onSubmit: SubmitHandler<AdjustStockFormValues> = async (values) => {
        const { success } = await runAction(mutateAsync(values), {
            success: `Остаток «${product.name}» обновлён`,
        });

        if (success) close();
    };

    return (
        <FormDialog
            surface="sheet"
            title="Корректировка остатка"
            description={`Товар «${product.name}». Укажите фактический остаток — разница попадёт в журнал.`}
            form={form}
            onSubmit={onSubmit}
            submitLabel="Сохранить"
            requireValid={false}
            requireDirty={false}
            busy={isPending}
        >
            <Input
                name="stock"
                label="Остаток на складе"
                type="number"
                min="0"
                step="1"
                placeholder="0"
                description="Фактическое количество на складе."
            />
            <Input
                name="note"
                label="Комментарий"
                placeholder="Напр. инвентаризация, пересчёт"
            />
        </FormDialog>
    );
};
