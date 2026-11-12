'use client';

import { FormDialog } from '@/shared/components/common';
import type { Option } from '@/shared/types';
import { TaskForm } from '../form/TaskForm';
import { useTaskCreateModal } from '../hooks/useTaskCreateModal';

interface TaskCreateModalProps {
    projectId: string;
    assigneeOptions: Option[];
}

export const TaskCreateModal = ({ projectId, assigneeOptions }: TaskCreateModalProps) => {
    const { isPending, form, onSubmit } = useTaskCreateModal(projectId);

    return (
        <FormDialog
            title="Новая задача"
            description="Задача появится на доске в колонке выбранного статуса."
            className="sm:max-w-2xl"
            form={form}
            onSubmit={onSubmit}
            submitLabel="Создать"
            busy={isPending}
        >
            <TaskForm assigneeOptions={assigneeOptions} />
        </FormDialog>
    );
};
