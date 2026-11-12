'use client';

import { FormDialog } from '@/shared/components/common';
import type { ProjectCategoryView } from '@/contexts/projectCategory';
import { CategoryForm } from '../form/CategoryForm';
import { useCategoryEditSheet } from '../hooks/useCategoryEditSheet';

interface CategoryEditSheetProps {
    projectId: string;
    category: ProjectCategoryView;
}

export const CategoryEditSheet = ({ projectId, category }: CategoryEditSheetProps) => {
    const { isPending, parentOptions, form, onSubmit } = useCategoryEditSheet(projectId, category);

    return (
        <FormDialog
            surface="sheet"
            title="Изменить категорию"
            description="При смене родителя категория встанет в конец его списка."
            form={form}
            onSubmit={onSubmit}
            submitLabel="Сохранить"
            busy={isPending}
        >
            <CategoryForm parentOptions={parentOptions} />
        </FormDialog>
    );
};
