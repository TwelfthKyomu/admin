'use client';

import { type SubmitHandler, useForm } from 'react-hook-form';
import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import { toast } from '@/shared/lib/toast';
import type { ChatMessageView } from '@/contexts/chat';
import type { ProjectView } from '@/contexts/project';
import { TaskPriority, TaskStatus, useCreateTask } from '@/contexts/task';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    TaskFromMessageFormSchema,
    type TaskFromMessageFormValues,
} from '../form/formData';
import { taskKeyLabel, taskTitleFromMessage } from '../lib/task';

export const useTaskFromMessageModal = ({
    message,
    projects,
    defaultProjectId,
}: {
    message: ChatMessageView;
    projects: ProjectView[];
    defaultProjectId: string;
}) => {
    const close = useModalClose();

    const form = useForm<TaskFromMessageFormValues>({
        defaultValues: {
            projectId: defaultProjectId,
            title: taskTitleFromMessage(message.body),
            description: message.body,
        },
        resolver: zodResolver(TaskFromMessageFormSchema),
        mode: 'onChange',
    });

    const { mutateAsync, isPending } = useCreateTask();

    const onSubmit: SubmitHandler<TaskFromMessageFormValues> = async (
        values,
    ) => {
        const { success, response } = await runAction(
            mutateAsync({
                ...values,
                status: TaskStatus.TODO,
                priority: TaskPriority.NONE,
                chatMessageId: message.id,
            }),
        );

        if (!success) return;

        const project = projects.find(
            (candidate) => candidate.id === values.projectId,
        );

        const number = response?.data?.number;

        toast.success(
            project && number
                ? `Задача ${taskKeyLabel(project.key, number)} создана из сообщения`
                : 'Задача создана из сообщения',
        );

        close();
    };

    return { form, isPending, onSubmit };
};
