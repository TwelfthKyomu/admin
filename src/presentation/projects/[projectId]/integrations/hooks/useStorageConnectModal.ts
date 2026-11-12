'use client';

import { useForm } from 'react-hook-form';
import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import {
    ConnectStorageActionInputSchema,
    useConnectStorage,
} from '@/contexts/integration';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ConnectStorageFormValues } from '../form/formData';

export const useStorageConnectModal = (projectId: string) => {
    const close = useModalClose();
    const { mutateAsync, isPending } = useConnectStorage();

    const form = useForm<ConnectStorageFormValues>({
        resolver: zodResolver(ConnectStorageActionInputSchema),
        defaultValues: {
            projectId,
            name: 'Хранилище',
            endpoint: '',
            region: 'auto',
            bucket: '',
            accessKeyId: '',
            secretAccessKey: '',
        },
    });

    const onSubmit = async (values: ConnectStorageFormValues) => {
        const { success } = await runAction(mutateAsync(values), {
            success: `Хранилище «${values.name}» подключено`,
        });

        if (success) close();
    };

    return { close, isPending, form, onSubmit };
};
