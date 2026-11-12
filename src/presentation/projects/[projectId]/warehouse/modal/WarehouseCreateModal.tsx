'use client';

import { FormDialog } from '@/shared/components/common';
import { WarehouseForm } from '../form/WarehouseForm';
import { useWarehouseCreateModal } from '../hooks/useWarehouseCreateModal';

export const WarehouseCreateModal = ({ projectId }: { projectId: string }) => {
    const { isPending, form, onSubmit } = useWarehouseCreateModal(projectId);

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
