'use client';

import { type SubmitHandler, useForm } from 'react-hook-form';
import { FormDialog } from '@/shared/components/common';
import { clientLabel } from '@/shared/format/name';
import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import { type ClientView, UpdateClientActionInputSchema, useUpdateClient } from '@/contexts/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { ClientForm } from '../form/ClientForm';
import type { UpdateClientFormValues } from '../form/formData';

interface ClientEditSheetProps {
    projectId: string;
    client: ClientView;
}

export const ClientEditSheet = ({ projectId, client }: ClientEditSheetProps) => {
    const close = useModalClose();
    const { mutateAsync, isPending } = useUpdateClient(projectId);

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

    return (
        <FormDialog
            surface="sheet"
            title="Клиент"
            description="Заказы и сумма покупок считаются сами по завершённым заказам."
            form={form}
            onSubmit={onSubmit}
            submitLabel="Сохранить"
            busy={isPending}
        >
            <ClientForm />
        </FormDialog>
    );
};
