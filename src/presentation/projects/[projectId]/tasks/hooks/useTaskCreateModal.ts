'use client';

import { type SubmitHandler, useForm } from 'react-hook-form';
import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import { fromNone } from '@/shared/lib/none';
import { useCreateTask } from '@/contexts/task';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    TASK_DEFAULT,
    TaskFormSchema,
    type TaskFormValues,
} from '../form/formData';

export const useTaskCreateModal = (projectId: string) => {
    const close = useModalClose();
    const { mutateAsync, isPending } = useCreateTask();

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
            { success: `Задача «${values.title}» создана` },
        );

        if (success) close();
    };

    return { isPending, form, onSubmit };
};
