'use client';

import { FormDialog } from '@/shared/components/common';
import type { Option } from '@/shared/types';
import type { TaskView } from '@/contexts/task';
import { TaskForm } from '../form/TaskForm';
import { useTaskEditSheet } from '../hooks/useTaskEditSheet';

interface TaskEditSheetProps {
    projectId: string;
    task: TaskView;
    assigneeOptions: Option[];
}

export const TaskEditSheet = ({ projectId, task, assigneeOptions }: TaskEditSheetProps) => {
    const { isPending, form, onSubmit } = useTaskEditSheet(projectId, task);

    return (
        <FormDialog
            surface="sheet"
            title="Изменить задачу"
            description="Статус можно менять и перетаскиванием карточки на доске."
            form={form}
            onSubmit={onSubmit}
            submitLabel="Сохранить"
            busy={isPending}
        >
            <TaskForm assigneeOptions={assigneeOptions} />
        </FormDialog>
    );
};
