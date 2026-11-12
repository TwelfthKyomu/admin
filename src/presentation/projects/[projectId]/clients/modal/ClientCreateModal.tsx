'use client';

import { FormDialog } from '@/shared/components/common';
import { ClientForm } from '../form/ClientForm';
import { useClientCreateModal } from '../hooks/useClientCreateModal';

export const ClientCreateModal = ({ projectId }: { projectId: string }) => {
    const { isPending, form, onSubmit } = useClientCreateModal(projectId);

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
