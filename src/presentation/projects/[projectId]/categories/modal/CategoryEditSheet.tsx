'use client';

import { type SubmitHandler, useForm } from 'react-hook-form';
import { FormDialog } from '@/shared/components/common';
import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import { fromNone, NONE } from '@/shared/lib/none';
import {
    type ProjectCategoryView,
    UpdateCategoryActionInputSchema,
    useCategoriesList,
    useUpdateCategory,
} from '@/contexts/projectCategory';
import { zodResolver } from '@hookform/resolvers/zod';
import { CategoryForm } from '../form/CategoryForm';
import type { UpdateCategoryFormValues } from '../form/formData';

function subtreeIds(rootId: string, categories: ProjectCategoryView[]): Set<string> {
    const ids = new Set([rootId]);
    let grew = true;

    while (grew) {
        grew = false;

        for (const category of categories) {
            if (category.parentId && ids.has(category.parentId) && !ids.has(category.id)) {
                ids.add(category.id);
                grew = true;
            }
        }
    }

    return ids;
}

interface CategoryEditSheetProps {
    projectId: string;
    category: ProjectCategoryView;
}

export const CategoryEditSheet = ({ projectId, category }: CategoryEditSheetProps) => {
    const close = useModalClose();
    const { mutateAsync, isPending } = useUpdateCategory(projectId);
    const categories = useCategoriesList({ projectId, includeInactive: true }).data ?? [];
    const excluded = subtreeIds(category.id, categories);

    const parentOptions = [
        { value: NONE, label: 'Без родителя' },
        ...categories
            .filter((candidate) => !excluded.has(candidate.id))
            .map((candidate) => ({ value: candidate.id, label: candidate.name })),
    ];

    const form = useForm<UpdateCategoryFormValues>({
        resolver: zodResolver(UpdateCategoryActionInputSchema),
        values: {
            id: category.id,
            projectId,
            parentId: category.parentId ?? NONE,
            name: category.name,
            type: category.type,
            isActive: category.isActive,
        },
        mode: 'onChange',
    });

    const onSubmit: SubmitHandler<UpdateCategoryFormValues> = async (values) => {
        const { success } = await runAction(
            mutateAsync({ ...values, parentId: fromNone(values.parentId) }),
            {
                success: `Категория «${category.name}» обновлена`,
            },
        );

        if (success) close();
    };

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
