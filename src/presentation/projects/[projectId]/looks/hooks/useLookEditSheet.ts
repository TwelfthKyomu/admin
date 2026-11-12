'use client';

import { type SubmitHandler, useForm } from 'react-hook-form';
import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import {
    type LookView,
    UpdateLookActionInputSchema,
    useUpdateLook,
} from '@/contexts/look';
import { zodResolver } from '@hookform/resolvers/zod';
import type { UpdateLookFormValues } from '../form/formData';

export const useLookEditSheet = (projectId: string, look: LookView) => {
    const close = useModalClose();
    const { mutateAsync, isPending } = useUpdateLook();

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

    return { isPending, form, onSubmit };
};
