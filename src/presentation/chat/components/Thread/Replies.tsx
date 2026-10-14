'use client';

import type { ChatMessageView } from '@/contexts/chat';
import { ThreadReply } from './Reply';

interface ThreadRepliesProps {
    replies: ChatMessageView[];
    viewerId: string;
    canModerate: boolean;
    editingId?: string;
    onEdit: (message: ChatMessageView) => void;
    onDelete: (messageId: string) => void;
}

export const ThreadReplies = ({
    replies,
    viewerId,
    canModerate,
    editingId,
    onEdit,
    onDelete,
}: ThreadRepliesProps) => {
    if (replies.length === 0) {
        return (
            <p className="py-4 text-center text-[12.5px] text-muted-foreground">
                Ответов пока нет.
            </p>
        );
    }

    return replies.map((reply) => {
        const own = reply.authorUserId === viewerId;

        return (
            <ThreadReply
                key={reply.id}
                reply={reply}
                own={own}
                canDelete={own || canModerate}
                editing={editingId === reply.id}
                onEdit={() => onEdit(reply)}
                onDelete={() => onDelete(reply.id)}
            />
        );
    });
};
