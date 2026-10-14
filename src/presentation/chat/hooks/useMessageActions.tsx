'use client';

import { useStaticData } from '@/app/providers';
import { runAction } from '@/shared/lib/action-result';
import { confirmDestructive, modal } from '@/shared/lib/modal';
import { toast } from '@/shared/lib/toast';
import {
    type ChatMessageView,
    type ChatReaction,
    type ChatTarget,
    useDeleteChatMessage,
    useSetChatMessagePin,
    useSetChatReaction,
} from '@/contexts/chat';
import { TASK_WRITE_PERMISSIONS } from '@/contexts/user';
import dynamic from 'next/dynamic';
import { serializeChatTarget } from '../lib/chatUrl';

const TaskFromMessageModal = dynamic(() =>
    import('../modal/TaskFromMessageModal').then((m) => m.TaskFromMessageModal),
);

async function copyToClipboard(text: string, success: string) {
    try {
        await navigator.clipboard.writeText(text);
        toast.success(success);
    } catch {
        toast.error('Буфер обмена недоступен');
    }
}

interface UseMessageActionsOptions {
    target: ChatTarget;
    scope: string;
}

export function useMessageActions({ target, scope }: UseMessageActionsOptions) {
    const { projects, projectPermissions } = useStaticData();
    const remove = useDeleteChatMessage(scope);
    const react = useSetChatReaction(scope);
    const pin = useSetChatMessagePin(scope);

    const deleteMessage = (messageId: string) => {
        void confirmDestructive({
            title: 'Удалить сообщение?',
            description: 'Сообщение и его обсуждение исчезнут у всех участников чата.',
            success: 'Сообщение удалено',
            onConfirm: () => remove.mutateAsync({ messageId }),
        });
    };

    const setReaction = (messageId: string, emoji: ChatReaction) => {
        void runAction(react.mutateAsync({ messageId, emoji }));
    };

    const togglePin = (message: ChatMessageView) => {
        const pinned = !message.pinnedAt;

        void runAction(pin.mutateAsync({ messageId: message.id, pinned }), {
            success: pinned ? 'Сообщение закреплено' : 'Сообщение откреплено',
        });
    };

    const copyMessage = (body: string) => {
        void copyToClipboard(body, 'Сообщение скопировано');
    };

    const copyMessageLink = (messageId: string) => {
        const url = new URL(window.location.href);

        url.search = '';
        url.searchParams.set('channel', serializeChatTarget(target));
        url.searchParams.set('message', messageId);

        void copyToClipboard(url.toString(), 'Ссылка скопирована');
    };

    const taskProjects = (projects ?? []).filter((project) =>
        TASK_WRITE_PERMISSIONS.some((permission) =>
            projectPermissions[project.id]?.includes(permission),
        ),
    );

    const defaultProjectId =
        target.kind === 'project' && taskProjects.some((project) => project.id === target.projectId)
            ? target.projectId
            : taskProjects[0]?.id;

    const createTask = (message: ChatMessageView) => {
        void modal.open(
            <TaskFromMessageModal
                message={message}
                scope={scope}
                projects={taskProjects}
                defaultProjectId={defaultProjectId ?? ''}
            />,
        );
    };

    return {
        createTask: taskProjects.length > 0 ? createTask : undefined,
        deleteMessage,
        setReaction,
        togglePin,
        copyMessage,
        copyMessageLink,
    };
}
