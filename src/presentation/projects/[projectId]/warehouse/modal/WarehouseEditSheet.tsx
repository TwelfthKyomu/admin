'use client';

import { FormDialog } from '@/shared/components/common';
import type { WarehouseView } from '@/contexts/warehouse';
import { WarehouseForm } from '../form/WarehouseForm';
import { useWarehouseEditSheet } from '../hooks/useWarehouseEditSheet';

interface WarehouseEditSheetProps {
    projectId: string;
    warehouse: WarehouseView;
}

export const WarehouseEditSheet = ({ projectId, warehouse }: WarehouseEditSheetProps) => {
    const { isPending, form, onSubmit } = useWarehouseEditSheet(projectId, warehouse);

    return (
        <FormDialog
            surface="sheet"
            title="Изменить склад"
            description="Остатки склада не меняются — только название и продажа на сайте."
            form={form}
            onSubmit={onSubmit}
            submitLabel="Сохранить"
            busy={isPending}
        >
            <WarehouseForm />
        </FormDialog>
    );
};
