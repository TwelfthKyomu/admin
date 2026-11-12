'use client';

import { type SubmitHandler, useForm } from 'react-hook-form';
import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import { useCreateIntegration } from '@/contexts/integration';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    CreateIntegrationFormSchema,
    type CreateIntegrationFormValues,
    INTEGRATION_DEFAULT,
} from '../form/formData';

export const useIntegrationCreateModal = (
    projectId: string,
    onIssued: (plaintextKey: string) => void,
) => {
    const close = useModalClose();
    const { mutateAsync, isPending } = useCreateIntegration();

    const form = useForm<CreateIntegrationFormValues>({
        defaultValues: INTEGRATION_DEFAULT,
        resolver: zodResolver(CreateIntegrationFormSchema),
        mode: 'onChange',
    });

    const onSubmit: SubmitHandler<CreateIntegrationFormValues> = async (
        values,
    ) => {
        const { success, response } = await runAction(
            mutateAsync({ ...values, projectId }),
        );

        if (success && response?.data) {
            onIssued(response.data.plaintextKey);
            close();
        }
    };

    return { isPending, form, onSubmit };
};
