'use client';

import { FormDialog } from '@/shared/components/common';
import { BadgeForm } from '../form/BadgeForm';
import { useBadgeCreateModal } from '../hooks/useBadgeCreateModal';

export const BadgeCreateModal = ({ projectId }: { projectId: string }) => {
    const { isPending, form, onSubmit } = useBadgeCreateModal(projectId);

    return (
        <FormDialog
            title="Новый бейдж"
            description="Используется во всех товарах проекта. Код менять нельзя после создания."
            className="sm:max-w-md"
            form={form}
            onSubmit={onSubmit}
            submitLabel="Создать"
            busy={isPending}
        >
            <BadgeForm />
        </FormDialog>
    );
};
