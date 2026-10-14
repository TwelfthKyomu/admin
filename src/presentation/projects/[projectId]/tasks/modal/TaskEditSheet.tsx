'use client';

import { type SubmitHandler, useForm } from 'react-hook-form';
import { FormDialog } from '@/shared/components/common';
import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import { fromNone, NONE } from '@/shared/lib/none';
import type { Option } from '@/shared/types';
import { type TaskView, useUpdateTask } from '@/contexts/task';
import { zodResolver } from '@hookform/resolvers/zod';
import { TaskFormSchema, type TaskFormValues } from '../form/formData';
import { TaskForm } from '../form/TaskForm';

interface TaskEditSheetProps {
    projectId: string;
    task: TaskView;
    assigneeOptions: Option[];
}

export const TaskEditSheet = ({ projectId, task, assigneeOptions }: TaskEditSheetProps) => {
    const close = useModalClose();
    const { mutateAsync, isPending } = useUpdateTask(projectId);

    const form = useForm<TaskFormValues>({
        values: {
            title: task.title,
            description: task.description ?? '',
            status: task.status,
            priority: task.priority,
            assigneeUserId: task.assigneeUserId ?? NONE,
            dueAt: task.dueAt,
            subtasks: task.subtasks,
        },
        resolver: zodResolver(TaskFormSchema),
        mode: 'onChange',
    });

    const onSubmit: SubmitHandler<TaskFormValues> = async (values) => {
        const { success } = await runAction(
            mutateAsync({
                ...values,
                assigneeUserId: fromNone(values.assigneeUserId),
                id: task.id,
                projectId,
            }),
            { success: 'Задача обновлена' },
        );

        if (success) close();
    };

    return (
        <FormDialog
            surface="sheet"
            title="Задача"
            form={form}
            onSubmit={onSubmit}
            submitLabel="Сохранить"
            busy={isPending}
        >
            <TaskForm assigneeOptions={assigneeOptions} />
        </FormDialog>
    );
};
