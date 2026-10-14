'use client';

import { useForm } from 'react-hook-form';
import { FormDialog } from '@/shared/components/common';
import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import { fromNone, NONE } from '@/shared/lib/none';
import { type ProductView, useUpdateProduct } from '@/contexts/product';
import { zodResolver } from '@hookform/resolvers/zod';
import { UpdateProductFormSchema, type UpdateProductFormValues } from '../form/formData';
import { ProductForm } from '../form/ProductForm';

interface ProductEditSheetProps {
    projectId: string;
    product: ProductView;
}

export const ProductEditSheet = ({ projectId, product }: ProductEditSheetProps) => {
    const close = useModalClose();
    const { mutateAsync, isPending } = useUpdateProduct(projectId);

    const form = useForm<UpdateProductFormValues>({
        values: {
            ...product,
            categoryId: product.categoryId ?? NONE,
        },
        resolver: zodResolver(UpdateProductFormSchema),
        mode: 'onChange',
    });

    const onSubmit = async (values: UpdateProductFormValues) => {
        const { success } = await runAction(
            mutateAsync({
                ...values,
                categoryId: fromNone(values.categoryId),
                id: product.id,
                projectId,
            }),
            { success: `Товар «${values.name}» обновлён` },
        );

        if (success) close();
    };

    return (
        <FormDialog
            surface="sheet"
            title="Редактирование товара"
            description="Изменения применятся сразу после сохранения."
            form={form}
            onSubmit={onSubmit}
            submitLabel="Изменить"
            busy={isPending}
        >
            <ProductForm
                projectId={projectId}
                mode="edit"
            />
        </FormDialog>
    );
};
