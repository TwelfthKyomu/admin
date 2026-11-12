'use client';

import { useForm } from 'react-hook-form';
import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import { fromNone, NONE } from '@/shared/lib/none';
import { type ProductView, useUpdateProduct } from '@/contexts/product';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    UpdateProductFormSchema,
    type UpdateProductFormValues,
} from '../form/formData';

export const useProductEditSheet = (
    projectId: string,
    product: ProductView,
) => {
    const close = useModalClose();
    const { mutateAsync, isPending } = useUpdateProduct();

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

    return { isPending, form, onSubmit };
};
