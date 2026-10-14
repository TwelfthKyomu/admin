'use client';

import { useProject } from '@/app/providers';
import { confirmDestructive, modal } from '@/shared/lib/modal';
import {
    type ProjectCategoryView,
    useCategoriesList,
    useDeleteCategory,
} from '@/contexts/projectCategory';
import dynamic from 'next/dynamic';

const CategoryCreateModal = dynamic(() =>
    import('../modal/CategoryCreateModal').then((m) => m.CategoryCreateModal),
);

const CategoryEditSheet = dynamic(() =>
    import('../modal/CategoryEditSheet').then((m) => m.CategoryEditSheet),
);

export function useCategoriesPage() {
    const { projectId } = useProject();
    const query = useCategoriesList({ projectId, includeInactive: true });
    const { mutateAsync, isPending } = useDeleteCategory(projectId);

    const onCreate = () => modal.open(<CategoryCreateModal projectId={projectId} />);

    const onEdit = (category: ProjectCategoryView) =>
        modal.open(
            <CategoryEditSheet
                projectId={projectId}
                category={category}
            />,
        );

    const onDelete = (category: ProjectCategoryView) =>
        confirmDestructive({
            title: 'Удалить категорию?',
            description: (
                <>
                    Категория <strong>«{category.name}»</strong> будет удалена. Товары останутся, но
                    потеряют привязку к ней.
                </>
            ),
            success: `Категория «${category.name}» удалена`,
            onConfirm: () => mutateAsync({ id: category.id, projectId }),
        });

    return { query, onCreate, onEdit, onDelete, isDeleting: isPending };
}
