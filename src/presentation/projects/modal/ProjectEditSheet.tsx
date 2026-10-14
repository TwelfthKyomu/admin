'use client';

import { type SubmitHandler, useForm } from 'react-hook-form';
import { FormDialog } from '@/shared/components/common';
import { toCurrency } from '@/shared/constants/currency';
import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import {
    type ProjectView,
    UpdateProjectActionInputSchema,
    useUpdateProject,
} from '@/contexts/project';
import { zodResolver } from '@hookform/resolvers/zod';
import type { UpdateProjectFormValues } from '../form/formData';
import { ProjectForm } from '../form/ProjectForm';

export const ProjectEditSheet = ({ project }: { project: ProjectView }) => {
    const close = useModalClose();
    const { mutateAsync, isPending } = useUpdateProject();

    const form = useForm<UpdateProjectFormValues>({
        resolver: zodResolver(UpdateProjectActionInputSchema),
        values: {
            ...project,
            description: project.description ?? '',
            color: project.color ?? '',
            defaultCurrency: toCurrency(project.defaultCurrency),
        },
        mode: 'onChange',
    });

    const onSubmit: SubmitHandler<UpdateProjectFormValues> = async (values) => {
        const { success } = await runAction(mutateAsync(values), {
            success: `Проект «${values.name}» обновлён`,
        });

        if (success) close();
    };

    return (
        <FormDialog
            surface="sheet"
            title="Настройки проекта"
            description="Идентификатор и код проекта менять нельзя."
            form={form}
            onSubmit={onSubmit}
            submitLabel="Сохранить"
            busy={isPending}
        >
            <ProjectForm />
        </FormDialog>
    );
};
