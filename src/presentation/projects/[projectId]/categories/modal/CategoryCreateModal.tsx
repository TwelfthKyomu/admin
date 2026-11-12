'use client';

import { FormDialog } from '@/shared/components/common';
import { CategoryForm } from '../form/CategoryForm';
import { useCategoryCreateModal } from '../hooks/useCategoryCreateModal';

export const CategoryCreateModal = ({ projectId }: { projectId: string }) => {
    const { isPending, parentOptions, form, onSubmit } = useCategoryCreateModal(projectId);

    return (
        <FormDialog
            title="Новая категория"
            description="Привязывайте товары к категориям для навигации на сайте."
            className="sm:max-w-md"
            form={form}
            onSubmit={onSubmit}
            submitLabel="Создать"
            busy={isPending}
        >
            <CategoryForm parentOptions={parentOptions} />
        </FormDialog>
    );
};
