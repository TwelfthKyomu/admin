'use client';

import { type SubmitHandler, useForm } from 'react-hook-form';
import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import {
    CreateProjectInviteActionInputSchema,
    useCreateProjectInvite,
} from '@/contexts/projectInvite';
import { zodResolver } from '@hookform/resolvers/zod';
import { type CreateInviteFormValues, INVITE_DEFAULT } from '../form/formData';
import { copyInviteLink } from '../lib/inviteLink';

export const useInviteCreateModal = (projectId: string) => {
    const close = useModalClose();
    const { mutateAsync, isPending } = useCreateProjectInvite();

    const form = useForm<CreateInviteFormValues>({
        resolver: zodResolver(CreateProjectInviteActionInputSchema),
        defaultValues: { ...INVITE_DEFAULT, projectId },
        mode: 'onChange',
    });

    const onSubmit: SubmitHandler<CreateInviteFormValues> = async (values) => {
        const { success, response } = await runAction(
            mutateAsync({
                projectId,
                email: values.email,
            }),
        );

        if (!success) return;

        const token = response?.data?.token;

        if (token) {
            await copyInviteLink(
                token,
                'Ссылка создана и скопирована. Код — в списке ниже.',
            );
        }

        close();
    };

    return { isPending, form, onSubmit };
};
