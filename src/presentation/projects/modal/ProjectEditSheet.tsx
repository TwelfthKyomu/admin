'use client';

import { FormDialog } from '@/shared/components/common';
import type { ProjectView } from '@/contexts/project';
import { ProjectForm } from '../form/ProjectForm';
import { useProjectEditSheet } from '../hooks/useProjectEditSheet';

export const ProjectEditSheet = ({ project }: { project: ProjectView }) => {
    const { isPending, form, onSubmit } = useProjectEditSheet(project);

    return (
        <FormDialog
            surface="sheet"
            title="Настройки проекта"
            description="Идентификатор и код проекта менять нельзя."
            form={form}
            onSubmit={onSubmit}
            submitLabel="Сохранить"
            busy={isPending}
        >
            <ProjectForm />
        </FormDialog>
    );
};
