'use client';

import { type SubmitHandler, useForm } from 'react-hook-form';
import { FormDialog } from '@/shared/components/common';
import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import { fromNone, NONE } from '@/shared/lib/none';
import {
    CreateCategoryActionInputSchema,
    useCategoriesList,
    useCreateCategory,
} from '@/contexts/projectCategory';
import { zodResolver } from '@hookform/resolvers/zod';
import { CategoryForm } from '../form/CategoryForm';
import { CATEGORY_DEFAULT, type CreateCategoryFormValues } from '../form/formData';

export const CategoryCreateModal = ({ projectId }: { projectId: string }) => {
    const close = useModalClose();
    const { mutateAsync, isPending } = useCreateCategory(projectId);
    const categories = useCategoriesList({ projectId, includeInactive: false }).data ?? [];

    const parentOptions = categories.length
        ? [
              { value: NONE, label: 'Без родителя' },
              ...categories.map((category) => ({
                  value: category.id,
                  label: category.name,
              })),
          ]
        : undefined;

    const form = useForm<CreateCategoryFormValues>({
        resolver: zodResolver(CreateCategoryActionInputSchema),
        defaultValues: { ...CATEGORY_DEFAULT, projectId },
        mode: 'onChange',
    });

    const onSubmit: SubmitHandler<CreateCategoryFormValues> = async (values) => {
        const { success } = await runAction(
            mutateAsync({
                ...values,
                parentId: fromNone(values.parentId),
            }),
            { success: `Категория «${values.name}» создана` },
        );

        if (success) close();
    };

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
