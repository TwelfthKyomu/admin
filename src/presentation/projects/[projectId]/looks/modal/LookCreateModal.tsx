'use client';

import { type SubmitHandler, useForm } from 'react-hook-form';
import { FormDialog } from '@/shared/components/common';
import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import { CreateLookActionInputSchema, useCreateLook } from '@/contexts/look';
import { zodResolver } from '@hookform/resolvers/zod';
import { type CreateLookFormValues, LOOK_DEFAULT } from '../form/formData';
import { LookForm } from '../form/LookForm';

export const LookCreateModal = ({ projectId }: { projectId: string }) => {
    const close = useModalClose();
    const { mutateAsync, isPending } = useCreateLook(projectId);

    const form = useForm<CreateLookFormValues>({
        defaultValues: { ...LOOK_DEFAULT, projectId },
        resolver: zodResolver(CreateLookActionInputSchema),
        mode: 'onChange',
    });

    const onSubmit: SubmitHandler<CreateLookFormValues> = async (values) => {
        const { success } = await runAction(mutateAsync(values), {
            success: `Образ «${values.title}» создан`,
        });

        if (success) close();
    };

    return (
        <FormDialog
            title="Новый образ"
            description="Фото с несколькими товарами. На сайте покупатель увидит отметки и сможет взять весь образ."
            className="sm:max-w-xl"
            form={form}
            onSubmit={onSubmit}
            submitLabel="Создать"
            busy={isPending}
        >
            <LookForm projectId={projectId} />
        </FormDialog>
    );
};
