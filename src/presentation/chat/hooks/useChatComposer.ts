'use client';

import { useRef, useState } from 'react';
import { runAction } from '@/shared/lib/action-result';
import { getErrorMessage } from '@/shared/lib/errors';
import { toast } from '@/shared/lib/toast';
import {
    CHAT_ATTACHMENTS_PER_MESSAGE,
    type ChatAttachmentView,
    type ChatMessageView,
    type ChatTarget,
    type ChatUserView,
    isPendingMessage,
    useEditChatMessage,
    useSendChatMessage,
} from '@/contexts/chat';
import { uploadChatFile } from '../lib/attachments';
import { readDraft, writeDraft } from '../lib/drafts';

export interface PendingAttachment {
    key: string;
    name: string;
    sizeBytes: number;
    contentType: string;
    status: 'uploading' | 'error' | 'done';
    error?: string;
    attachment?: ChatAttachmentView;
}

interface UseChatComposerOptions {
    organizationId: string;
    target: ChatTarget;
    scope: string;
    threadRootId?: string;
    viewer: ChatUserView;
    messages: ChatMessageView[];
    onSent?: () => void;
}

export function useChatComposer({
    organizationId,
    target,
    scope,
    threadRootId,
    viewer,
    messages,
    onSent,
}: UseChatComposerOptions) {
    const draftKey = `${viewer.id}:${threadRootId ? `${scope}#${threadRootId}` : scope}`;

    const [draft, setDraft] = useState(() => readDraft(draftKey));
    const [replyTo, setReplyTo] = useState<ChatMessageView>();
    const [editing, setEditing] = useState<ChatMessageView>();
    const [attachments, setAttachments] = useState<PendingAttachment[]>([]);

    const draftBeforeEdit = useRef<string>(undefined);

    const send = useSendChatMessage(organizationId, target, viewer);
    const edit = useEditChatMessage(scope);
    const isPending = send.isPending || edit.isPending;

    const patchAttachment = (key: string, patch: Partial<PendingAttachment>) =>
        setAttachments((current) =>
            current.map((item) =>
                item.key === key ? { ...item, ...patch } : item,
            ),
        );

    const addFiles = (files: File[]) => {
        const free = CHAT_ATTACHMENTS_PER_MESSAGE - attachments.length;

        if (files.length > free) {
            toast.error(
                `В одном сообщении — не больше ${CHAT_ATTACHMENTS_PER_MESSAGE} файлов`,
            );
        }

        const uploads = files
            .slice(0, Math.max(0, free))
            .map((file) => ({ file, key: crypto.randomUUID() }));

        if (uploads.length === 0) return;

        setAttachments((current) => [
            ...current,
            ...uploads.map(
                ({ file, key }): PendingAttachment => ({
                    key,
                    name: file.name,
                    sizeBytes: file.size,
                    contentType: file.type,
                    status: 'uploading',
                }),
            ),
        ]);

        for (const { file, key } of uploads) {
            uploadChatFile(target, file).then(
                (attachment) =>
                    patchAttachment(key, {
                        status: 'done',
                        attachment,
                        contentType: attachment.contentType,
                    }),
                (error: unknown) =>
                    patchAttachment(key, {
                        status: 'error',
                        error: getErrorMessage(error),
                    }),
            );
        }
    };

    const removeAttachment = (key: string) =>
        setAttachments((current) => current.filter((item) => item.key !== key));

    const ready = attachments.flatMap((item) =>
        item.status === 'done' && item.attachment ? [item.attachment] : [],
    );

    const uploading = attachments.some((item) => item.status === 'uploading');
    const hasText = draft.trim().length > 0;

    const canSend = editing
        ? hasText || editing.attachments.length > 0
        : !uploading && (hasText || ready.length > 0);

    const canSubmit = !isPending && canSend;

    const changeDraft = (value: string) => {
        if (!editing) writeDraft(draftKey, value);

        setDraft(value);
    };

    const leaveEdit = () => {
        setEditing(undefined);
        const restored = draftBeforeEdit.current ?? '';

        draftBeforeEdit.current = undefined;
        setDraft(restored);
    };

    const startEdit = (message: ChatMessageView) => {
        if (draftBeforeEdit.current === undefined) {
            draftBeforeEdit.current = draft;
        }

        setReplyTo(undefined);
        setEditing(message);
        setDraft(message.body);
    };

    const editLastOwnMessage = () => {
        const own = messages.findLast(
            (message) =>
                message.authorUserId === viewer.id &&
                !isPendingMessage(message.id),
        );

        if (own) startEdit(own);
    };

    const submit = async () => {
        if (!canSubmit) return;

        const body = draft.trim();

        if (editing) {
            if (body !== editing.body) {
                const { success } = await runAction(
                    edit.mutateAsync({ messageId: editing.id, body }),
                );

                if (!success) return;
            }

            leaveEdit();

            return;
        }

        const { success } = await runAction(
            send.mutateAsync({
                target,
                body,
                replyToId: replyTo?.id,
                threadRootId,
                attachmentIds: ready.map((attachment) => attachment.id),
                attachments: ready,
            }),
        );

        if (!success) return;

        writeDraft(draftKey, '');
        setDraft('');
        setReplyTo(undefined);
        setAttachments([]);
        onSent?.();
    };

    return {
        draft,
        changeDraft,
        submit,
        canSubmit,
        isPending,
        attachments,
        addFiles,
        removeAttachment,
        replyTo,
        startReply: setReplyTo,
        cancelReply: () => setReplyTo(undefined),
        editing,
        startEdit,
        cancelEdit: leaveEdit,
        editLastOwnMessage,
    };
}

export type ChatComposer = ReturnType<typeof useChatComposer>;
