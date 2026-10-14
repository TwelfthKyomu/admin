'use client';

import { type SubmitHandler, useForm } from 'react-hook-form';
import { FormDialog } from '@/shared/components/common';
import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import { type LookView, UpdateLookActionInputSchema, useUpdateLook } from '@/contexts/look';
import { zodResolver } from '@hookform/resolvers/zod';
import type { UpdateLookFormValues } from '../form/formData';
import { LookForm } from '../form/LookForm';

interface LookEditSheetProps {
    projectId: string;
    look: LookView;
}

export const LookEditSheet = ({ projectId, look }: LookEditSheetProps) => {
    const close = useModalClose();
    const { mutateAsync, isPending } = useUpdateLook(projectId);

    const form = useForm<UpdateLookFormValues>({
        values: { ...look, projectId, description: look.description ?? '' },
        resolver: zodResolver(UpdateLookActionInputSchema),
        mode: 'onChange',
    });

    const onSubmit: SubmitHandler<UpdateLookFormValues> = async (values) => {
        const { success } = await runAction(mutateAsync(values), {
            success: `Образ «${values.title}» сохранён`,
        });

        if (success) close();
    };

    return (
        <FormDialog
            surface="sheet"
            title="Изменить образ"
            description="Фото с несколькими товарами. На сайте покупатель увидит отметки и сможет взять весь образ."
            form={form}
            onSubmit={onSubmit}
            submitLabel="Сохранить"
            busy={isPending}
        >
            <LookForm projectId={projectId} />
        </FormDialog>
    );
};
