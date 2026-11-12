'use client';

import { type SubmitHandler, useForm } from 'react-hook-form';
import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import {
    CreateWarehouseActionInputSchema,
    useCreateWarehouse,
} from '@/contexts/warehouse';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    type CreateWarehouseFormValues,
    WAREHOUSE_DEFAULT,
} from '../form/formData';

export const useWarehouseCreateModal = (projectId: string) => {
    const close = useModalClose();
    const { mutateAsync, isPending } = useCreateWarehouse();

    const form = useForm<CreateWarehouseFormValues>({
        defaultValues: { ...WAREHOUSE_DEFAULT, projectId },
        resolver: zodResolver(CreateWarehouseActionInputSchema),
        mode: 'onChange',
    });

    const onSubmit: SubmitHandler<CreateWarehouseFormValues> = async (
        values,
    ) => {
        const { success } = await runAction(mutateAsync(values), {
            success: `Склад «${values.name}» создан`,
        });

        if (success) close();
    };

    return { isPending, form, onSubmit };
};
