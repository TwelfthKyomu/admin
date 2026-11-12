'use client';

import { type SubmitHandler, useForm } from 'react-hook-form';
import { clientLabel } from '@/shared/format/name';
import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import {
    type ClientView,
    UpdateClientActionInputSchema,
    useUpdateClient,
} from '@/contexts/client';
import { zodResolver } from '@hookform/resolvers/zod';
import type { UpdateClientFormValues } from '../form/formData';

export const useClientEditSheet = (projectId: string, client: ClientView) => {
    const close = useModalClose();
    const { mutateAsync, isPending } = useUpdateClient();

    const form = useForm<UpdateClientFormValues>({
        resolver: zodResolver(UpdateClientActionInputSchema),
        values: {
            id: client.id,
            projectId,
            firstName: client.firstName,
            lastName: client.lastName ?? '',
            middleName: client.middleName ?? '',
            email: client.email ?? '',
            phone: client.phone ?? '',
        },
        mode: 'onChange',
    });

    const onSubmit: SubmitHandler<UpdateClientFormValues> = async (values) => {
        const { success } = await runAction(mutateAsync(values), {
            success: `Клиент ${clientLabel(client)} обновлён`,
        });

        if (success) close();
    };

    return { isPending, form, onSubmit };
};
