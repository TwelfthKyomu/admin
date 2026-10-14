'use client';

import { type SubmitHandler, useForm } from 'react-hook-form';
import { FormDialog } from '@/shared/components/common';
import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import { CreateClientActionInputSchema, useCreateClient } from '@/contexts/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { ClientForm } from '../form/ClientForm';
import { CLIENT_DEFAULT, type CreateClientFormValues } from '../form/formData';

export const ClientCreateModal = ({ projectId }: { projectId: string }) => {
    const close = useModalClose();
    const { mutateAsync, isPending } = useCreateClient(projectId);

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

    return (
        <FormDialog
            title="Новый клиент"
            description="Нужны имя и хотя бы один контакт: телефон или email."
            className="max-w-md"
            form={form}
            onSubmit={onSubmit}
            submitLabel="Добавить"
            busy={isPending}
        >
            <ClientForm />
        </FormDialog>
    );
};
