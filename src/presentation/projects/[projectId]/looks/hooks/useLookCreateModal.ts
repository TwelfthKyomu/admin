'use client';

import { type SubmitHandler, useForm } from 'react-hook-form';
import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import { CreateLookActionInputSchema, useCreateLook } from '@/contexts/look';
import { zodResolver } from '@hookform/resolvers/zod';
import { type CreateLookFormValues, LOOK_DEFAULT } from '../form/formData';

export const useLookCreateModal = (projectId: string) => {
    const close = useModalClose();
    const { mutateAsync, isPending } = useCreateLook();

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

    return { isPending, form, onSubmit };
};
