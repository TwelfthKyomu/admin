'use client';

import { type SubmitHandler, useForm } from 'react-hook-form';
import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import {
    CreateClientActionInputSchema,
    useCreateClient,
} from '@/contexts/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { CLIENT_DEFAULT, type CreateClientFormValues } from '../form/formData';

export const useClientCreateModal = (projectId: string) => {
    const close = useModalClose();
    const { mutateAsync, isPending } = useCreateClient();

    const form = useForm<CreateClientFormValues>({
        resolver: zodResolver(CreateClientActionInputSchema),
        defaultValues: { ...CLIENT_DEFAULT, projectId },
        mode: 'onChange',
    });

    const onSubmit: SubmitHandler<CreateClientFormValues> = async (values) => {
        const { success } = await runAction(mutateAsync(values), {
            success: `Клиент ${values.firstName} добавлен`,
        });

        if (success) close();
    };

    return { isPending, form, onSubmit };
};
