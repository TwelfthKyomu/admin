'use client';

import { FormDialog } from '@/shared/components/common';
import { LookForm } from '../form/LookForm';
import { useLookCreateModal } from '../hooks/useLookCreateModal';

export const LookCreateModal = ({ projectId }: { projectId: string }) => {
    const { isPending, form, onSubmit } = useLookCreateModal(projectId);

    return (
        <FormDialog
            title="Новый образ"
            description="Фото с несколькими товарами. На сайте покупатель увидит отметки и сможет взять весь образ."
            className="sm:max-w-xl"
            form={form}
            onSubmit={onSubmit}
            submitLabel="Создать"
            busy={isPending}
        >
            <LookForm projectId={projectId} />
        </FormDialog>
    );
};
