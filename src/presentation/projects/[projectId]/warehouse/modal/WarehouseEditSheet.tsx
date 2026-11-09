'use client';

import { type SubmitHandler, useForm } from 'react-hook-form';
import { FormDialog } from '@/shared/components/common';
import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import {
    UpdateWarehouseActionInputSchema,
    useUpdateWarehouse,
    type WarehouseView,
} from '@/contexts/warehouse';
import { zodResolver } from '@hookform/resolvers/zod';
import type { UpdateWarehouseFormValues } from '../form/formData';
import { WarehouseForm } from '../form/WarehouseForm';

interface WarehouseEditSheetProps {
    projectId: string;
    warehouse: WarehouseView;
}

export const WarehouseEditSheet = ({ projectId, warehouse }: WarehouseEditSheetProps) => {
    const close = useModalClose();
    const { mutateAsync, isPending } = useUpdateWarehouse();

    const form = useForm<UpdateWarehouseFormValues>({
        defaultValues: {
            id: warehouse.id,
            projectId,
            name: warehouse.name,
            forSite: warehouse.forSite,
        },
        resolver: zodResolver(UpdateWarehouseActionInputSchema),
        mode: 'onChange',
    });

    const onSubmit: SubmitHandler<UpdateWarehouseFormValues> = async (values) => {
        const { success } = await runAction(mutateAsync(values), {
            success: 'Склад сохранён',
        });

        if (success) close();
    };

    return (
        <FormDialog
            surface="sheet"
            title="Склад"
            form={form}
            onSubmit={onSubmit}
            submitLabel="Сохранить"
            busy={isPending}
        >
            <WarehouseForm />
        </FormDialog>
    );
};
