'use client';

import { FormDialog } from '@/shared/components/common';
import { ProjectForm } from '../form/ProjectForm';
import { useProjectCreateModal } from '../hooks/useProjectCreateModal';

export const ProjectCreateModal = () => {
    const { isPending, form, onSubmit } = useProjectCreateModal();

    return (
        <FormDialog
            title="Новый проект"
            description="Новый магазин внутри вашей организации."
            form={form}
            onSubmit={onSubmit}
            submitLabel="Создать"
            requireDirty={false}
            busy={isPending}
        >
            <ProjectForm />
        </FormDialog>
    );
};
