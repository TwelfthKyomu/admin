'use client';

import { FormDialog } from '@/shared/components/common';
import type { ClientView } from '@/contexts/client';
import { ClientForm } from '../form/ClientForm';
import { useClientEditSheet } from '../hooks/useClientEditSheet';

interface ClientEditSheetProps {
    projectId: string;
    client: ClientView;
}

export const ClientEditSheet = ({ projectId, client }: ClientEditSheetProps) => {
    const { isPending, form, onSubmit } = useClientEditSheet(projectId, client);

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
