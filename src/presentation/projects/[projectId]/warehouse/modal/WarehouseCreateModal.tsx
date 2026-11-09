'use client';

import { type SubmitHandler, useForm } from 'react-hook-form';
import { FormDialog } from '@/shared/components/common';
import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import { CreateWarehouseActionInputSchema, useCreateWarehouse } from '@/contexts/warehouse';
import { zodResolver } from '@hookform/resolvers/zod';
import { type CreateWarehouseFormValues, WAREHOUSE_DEFAULT } from '../form/formData';
import { WarehouseForm } from '../form/WarehouseForm';

export const WarehouseCreateModal = ({ projectId }: { projectId: string }) => {
    const close = useModalClose();
    const { mutateAsync, isPending } = useCreateWarehouse();

    const form = useForm<CreateWarehouseFormValues>({
        defaultValues: { ...WAREHOUSE_DEFAULT, projectId },
        resolver: zodResolver(CreateWarehouseActionInputSchema),
        mode: 'onChange',
    });

    const onSubmit: SubmitHandler<CreateWarehouseFormValues> = async (values) => {
        const { success } = await runAction(mutateAsync(values), {
            success: `Склад «${values.name}» создан`,
        });

        if (success) close();
    };

    return (
        <FormDialog
            title="Новый склад"
            description="Магазин, точка выдачи или склад — всё, где лежит товар."
            className="sm:max-w-md"
            form={form}
            onSubmit={onSubmit}
            submitLabel="Создать"
            busy={isPending}
        >
            <WarehouseForm />
        </FormDialog>
    );
};
