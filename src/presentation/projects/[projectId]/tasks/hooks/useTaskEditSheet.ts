'use client';

import { type SubmitHandler, useForm } from 'react-hook-form';
import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import { fromNone, NONE } from '@/shared/lib/none';
import { type TaskView, useUpdateTask } from '@/contexts/task';
import { zodResolver } from '@hookform/resolvers/zod';
import { TaskFormSchema, type TaskFormValues } from '../form/formData';

export const useTaskEditSheet = (projectId: string, task: TaskView) => {
    const close = useModalClose();
    const { mutateAsync, isPending } = useUpdateTask();

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
            { success: `Задача «${values.title}» обновлена` },
        );

        if (success) close();
    };

    return { isPending, form, onSubmit };
};
