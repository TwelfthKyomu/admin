'use client';

import { type SubmitHandler, useForm, useWatch } from 'react-hook-form';
import { FormDialog } from '@/shared/components/common';
import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import { toast } from '@/shared/lib/toast';
import type { ChatMessageView } from '@/contexts/chat';
import type { ProjectView } from '@/contexts/project';
import { TaskPriority, TaskStatus, useCreateTaskFromChat } from '@/contexts/task';
import { FieldGroup } from '@/ui/Base';
import { Input, Select, Textarea } from '@/ui/Controlled';
import { zodResolver } from '@hookform/resolvers/zod';
import { TaskFromMessageFormSchema, type TaskFromMessageFormValues } from '../form/formData';
import { taskKeyLabel, taskTitleFromMessage } from '../lib/task';

interface TaskFromMessageModalProps {
    message: ChatMessageView;
    scope: string;
    projects: ProjectView[];
    defaultProjectId: string;
}

export const TaskFromMessageModal = ({
    message,
    scope,
    projects,
    defaultProjectId,
}: TaskFromMessageModalProps) => {
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

    const projectId = useWatch({ control: form.control, name: 'projectId' });
    const { mutateAsync, isPending } = useCreateTaskFromChat(projectId, scope);

    const onSubmit: SubmitHandler<TaskFromMessageFormValues> = async (values) => {
        const { success, response } = await runAction(
            mutateAsync({
                ...values,
                status: TaskStatus.TODO,
                priority: TaskPriority.NONE,
                chatMessageId: message.id,
            }),
        );

        if (!success) return;

        const project = projects.find((candidate) => candidate.id === values.projectId);
        const number = response?.data?.number;

        toast.success(
            project && number
                ? `Задача ${taskKeyLabel(project.key, number)} создана из сообщения`
                : 'Задача создана из сообщения',
        );

        close();
    };

    return (
        <FormDialog
            title="Задача из сообщения"
            description="Текст сообщения станет описанием, задача появится на доске проекта."
            className="sm:max-w-lg"
            form={form}
            onSubmit={onSubmit}
            submitLabel="Создать задачу"
            requireDirty={false}
            busy={isPending}
        >
            <FieldGroup>
                <Select
                    name="projectId"
                    label="Проект"
                    options={projects.map((project) => ({
                        value: project.id,
                        label: project.name,
                    }))}
                />
                <Input
                    name="title"
                    label="Название"
                    placeholder="Что нужно сделать"
                />
                <Textarea
                    name="description"
                    label="Описание"
                    rows={4}
                />
            </FieldGroup>
        </FormDialog>
    );
};
