'use client';

import { type SubmitHandler, useForm } from 'react-hook-form';
import { FormDialog } from '@/shared/components/common';
import { slugify } from '@/shared/format/url';
import { useDerivedField } from '@/shared/hooks/useDerivedField';
import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import { CreateProjectActionInputSchema, useCreateProject } from '@/contexts/project';
import { zodResolver } from '@hookform/resolvers/zod';
import { type CreateProjectFormValues, deriveProjectKey, PROJECT_DEFAULT } from '../form/formData';
import { ProjectForm } from '../form/ProjectForm';

export const ProjectCreateModal = () => {
    const close = useModalClose();
    const { mutateAsync, isPending } = useCreateProject();

    const form = useForm<CreateProjectFormValues>({
        resolver: zodResolver(CreateProjectActionInputSchema),
        defaultValues: PROJECT_DEFAULT,
        mode: 'onChange',
    });

    useDerivedField({ form, from: 'name', to: 'slug', derive: slugify });
    useDerivedField({ form, from: 'name', to: 'key', derive: deriveProjectKey });

    const onSubmit: SubmitHandler<CreateProjectFormValues> = async (values) => {
        const { success } = await runAction(mutateAsync(values), {
            success: `Проект «${values.name}» создан`,
        });

        if (success) close();
    };

    return (
        <FormDialog
            title="Новый проект"
            description="Новый магазин внутри вашей организации."
            form={form}
            onSubmit={onSubmit}
            submitLabel="Создать"
            requireDirty={false}
            busy={isPending}
        >
            <ProjectForm />
        </FormDialog>
    );
};
