'use client';

import { type SubmitHandler, useForm } from 'react-hook-form';
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
import type { UpdateCategoryFormValues } from '../form/formData';
import { subtreeIds } from '../lib/subtree';

export const useCategoryEditSheet = (
    projectId: string,
    category: ProjectCategoryView,
) => {
    const close = useModalClose();
    const { mutateAsync, isPending } = useUpdateCategory();

    const categories =
        useCategoriesList({ projectId, includeInactive: true }).data ?? [];

    const excluded = subtreeIds(category.id, categories);

    const parentOptions = [
        { value: NONE, label: 'Без родителя' },
        ...categories
            .filter((candidate) => !excluded.has(candidate.id))
            .map((candidate) => ({
                value: candidate.id,
                label: candidate.name,
            })),
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

    const onSubmit: SubmitHandler<UpdateCategoryFormValues> = async (
        values,
    ) => {
        const { success } = await runAction(
            mutateAsync({ ...values, parentId: fromNone(values.parentId) }),
            {
                success: `Категория «${category.name}» обновлена`,
            },
        );

        if (success) close();
    };

    return { isPending, parentOptions, form, onSubmit };
};
