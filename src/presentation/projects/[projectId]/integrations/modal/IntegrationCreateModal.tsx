'use client';

import { FormDialog } from '@/shared/components/common';
import { FieldGroup } from '@/ui/Base';
import { Input } from '@/ui/Controlled';
import { useIntegrationCreateModal } from '../hooks/useIntegrationCreateModal';

interface CreateIntegrationModalProps {
    projectId: string;
    onIssued: (plaintextKey: string) => void;
}

export const IntegrationCreateModal = ({ projectId, onIssued }: CreateIntegrationModalProps) => {
    const { isPending, form, onSubmit } = useIntegrationCreateModal(projectId, onIssued);

    return (
        <FormDialog
            title="Подключить сайт"
            description="После создания будет показан API-ключ. Сохраните его — восстановить будет нельзя."
            className="sm:max-w-md"
            form={form}
            onSubmit={onSubmit}
            submitLabel="Выпустить ключ"
            busy={isPending}
        >
            <FieldGroup>
                <Input
                    name="name"
                    label="Название"
                    placeholder="error-brand"
                />
                <Input
                    name="siteUrl"
                    label="URL сайта (необязательно)"
                    type="url"
                    placeholder="https://error-brand.com"
                />
            </FieldGroup>
        </FormDialog>
    );
};
