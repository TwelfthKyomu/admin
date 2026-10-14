'use client';

import { type SubmitHandler, useForm } from 'react-hook-form';
import { FormDialog } from '@/shared/components/common';
import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import { useCreateIntegration } from '@/contexts/integration';
import { FieldGroup } from '@/ui/Base';
import { Input } from '@/ui/Controlled';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    CreateIntegrationFormSchema,
    type CreateIntegrationFormValues,
    INTEGRATION_DEFAULT,
} from '../form/formData';

interface CreateIntegrationModalProps {
    projectId: string;
    onIssued: (plaintextKey: string) => void;
}

export const IntegrationCreateModal = ({ projectId, onIssued }: CreateIntegrationModalProps) => {
    const close = useModalClose();
    const { mutateAsync, isPending } = useCreateIntegration(projectId);

    const form = useForm<CreateIntegrationFormValues>({
        defaultValues: INTEGRATION_DEFAULT,
        resolver: zodResolver(CreateIntegrationFormSchema),
        mode: 'onChange',
    });

    const onSubmit: SubmitHandler<CreateIntegrationFormValues> = async (values) => {
        const { success, response } = await runAction(mutateAsync({ ...values, projectId }));

        if (success && response?.data) {
            onIssued(response.data.plaintextKey);
            close();
        }
    };

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
