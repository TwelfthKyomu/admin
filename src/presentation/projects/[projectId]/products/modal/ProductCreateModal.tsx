'use client';

import { FormDialog } from '@/shared/components/common';
import { ProductEditor } from '../form/ProductEditor';
import { useProductCreateModal } from '../hooks/useProductCreateModal';

export const ProductCreateModal = ({ projectId }: { projectId: string }) => {
    const { isPending, form, onSubmit } = useProductCreateModal(projectId);

    return (
        <FormDialog
            title="Новый товар"
            description="URL-идентификатор подставится из названия."
            className="w-full sm:max-w-5xl"
            form={form}
            onSubmit={onSubmit}
            submitLabel="Создать"
            busy={isPending}
        >
            <ProductEditor
                projectId={projectId}
                isNew
            />
        </FormDialog>
    );
};
