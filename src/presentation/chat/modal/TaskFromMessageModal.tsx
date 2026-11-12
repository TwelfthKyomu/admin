'use client';

import { FormDialog } from '@/shared/components/common';
import type { ChatMessageView } from '@/contexts/chat';
import type { ProjectView } from '@/contexts/project';
import { FieldGroup } from '@/ui/Base';
import { Input, Select, Textarea } from '@/ui/Controlled';
import { useTaskFromMessageModal } from '../hooks/useTaskFromMessageModal';

interface TaskFromMessageModalProps {
    message: ChatMessageView;
    projects: ProjectView[];
    defaultProjectId: string;
}

export const TaskFromMessageModal = ({
    message,
    projects,
    defaultProjectId,
}: TaskFromMessageModalProps) => {
    const { form, isPending, onSubmit } = useTaskFromMessageModal({
        message,
        projects,
        defaultProjectId,
    });

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
