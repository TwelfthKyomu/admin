'use client';

import { type SubmitHandler, useForm } from 'react-hook-form';
import { slugify } from '@/shared/format/url';
import { useDerivedField } from '@/shared/hooks/useDerivedField';
import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import {
    CreateProjectActionInputSchema,
    useCreateProject,
} from '@/contexts/project';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    type CreateProjectFormValues,
    deriveProjectKey,
    PROJECT_DEFAULT,
} from '../form/formData';

export const useProjectCreateModal = () => {
    const close = useModalClose();
    const { mutateAsync, isPending } = useCreateProject();

    const form = useForm<CreateProjectFormValues>({
        resolver: zodResolver(CreateProjectActionInputSchema),
        defaultValues: PROJECT_DEFAULT,
        mode: 'onChange',
    });

    useDerivedField({ form, from: 'name', to: 'slug', derive: slugify });

    useDerivedField({
        form,
        from: 'name',
        to: 'key',
        derive: deriveProjectKey,
    });

    const onSubmit: SubmitHandler<CreateProjectFormValues> = async (values) => {
        const { success } = await runAction(mutateAsync(values), {
            success: `Проект «${values.name}» создан`,
        });

        if (success) close();
    };

    return { isPending, form, onSubmit };
};
