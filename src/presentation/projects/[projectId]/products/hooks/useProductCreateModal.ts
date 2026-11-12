'use client';

import { type SubmitHandler, useForm } from 'react-hook-form';
import { useStaticData } from '@/app/providers';
import { slugify } from '@/shared/format/url';
import { useDerivedField } from '@/shared/hooks/useDerivedField';
import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import { fromNone } from '@/shared/lib/none';
import { useCreateProduct } from '@/contexts/product';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    CreateProductFormSchema,
    type CreateProductFormValues,
    PRODUCT_DEFAULT,
} from '../form/formData';

export const useProductCreateModal = (projectId: string) => {
    const close = useModalClose();
    const { projects } = useStaticData();
    const { mutateAsync, isPending } = useCreateProduct();

    const projectCurrency = projects?.find(
        (project) => project.id === projectId,
    )?.defaultCurrency;

    const form = useForm<CreateProductFormValues>({
        defaultValues: {
            ...PRODUCT_DEFAULT,
            currency: projectCurrency ?? PRODUCT_DEFAULT.currency,
        },
        resolver: zodResolver(CreateProductFormSchema),
        mode: 'onChange',
    });

    useDerivedField({ form, from: 'name', to: 'slug', derive: slugify });

    const onSubmit: SubmitHandler<CreateProductFormValues> = async (values) => {
        const { success } = await runAction(
            mutateAsync({
                ...values,
                categoryId: fromNone(values.categoryId),
                projectId,
            }),
            { success: `Товар «${values.name}» создан` },
        );

        if (success) close();
    };

    return { isPending, form, onSubmit };
};
