'use client';

import { type SubmitHandler, useForm } from 'react-hook-form';
import { FormDialog } from '@/shared/components/common';
import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import { fromNone } from '@/shared/lib/none';
import type { Option } from '@/shared/types';
import { useCreateTask } from '@/contexts/task';
import { zodResolver } from '@hookform/resolvers/zod';
import { TASK_DEFAULT, TaskFormSchema, type TaskFormValues } from '../form/formData';
import { TaskForm } from '../form/TaskForm';

interface TaskCreateModalProps {
    projectId: string;
    assigneeOptions: Option[];
}

export const TaskCreateModal = ({ projectId, assigneeOptions }: TaskCreateModalProps) => {
    const close = useModalClose();
    const { mutateAsync, isPending } = useCreateTask(projectId);

    const form = useForm<TaskFormValues>({
        defaultValues: TASK_DEFAULT,
        resolver: zodResolver(TaskFormSchema),
        mode: 'onChange',
    });

    const onSubmit: SubmitHandler<TaskFormValues> = async (values) => {
        const { success } = await runAction(
            mutateAsync({
                ...values,
                assigneeUserId: fromNone(values.assigneeUserId),
                projectId,
            }),
            { success: 'Задача создана' },
        );

        if (success) close();
    };

    return (
        <FormDialog
            title="Новая задача"
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
