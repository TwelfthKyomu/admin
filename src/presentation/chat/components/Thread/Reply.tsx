'use client';

import { fmtTime } from '@/shared/format/date';
import { cn } from '@/shared/lib/utils';
import { type ChatMessageView, isPendingMessage } from '@/contexts/chat';
import { Pencil, Trash2 } from 'lucide-react';
import { DELETED_AUTHOR } from '../../lib/text';
import { ChatAvatar } from '../ChatAvatar';
import { MessageAttachments } from '../Message/Attachments';
import { MessageText } from '../Message/Text';
import { ToolbarButton } from '../Message/ToolbarButton';

interface ThreadReplyProps {
    reply: ChatMessageView;
    own: boolean;
    canDelete: boolean;
    editing: boolean;
    onEdit: () => void;
    onDelete: () => void;
}

export const ThreadReply = ({
    reply,
    own,
    canDelete,
    editing,
    onEdit,
    onDelete,
}: ThreadReplyProps) => {
    const pending = isPendingMessage(reply.id);
    const authorName = reply.authorName ?? DELETED_AUTHOR;

    return (
        <div
            className={cn(
                'group/reply relative -mx-1.5 flex gap-2 rounded-lg px-1.5 py-1 transition-colors hover:bg-foreground/5',
                editing && 'bg-foreground/5',
                pending && 'opacity-60',
            )}
        >
            <ChatAvatar
                size="xs"
                name={authorName}
                image={reply.authorImage}
                seed={reply.authorUserId ?? authorName}
            />
            <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-1.5">
                    <span className="truncate text-[12px] leading-[1.2] font-medium">
                        {authorName}
                    </span>
                    <span className="font-mono text-[10.5px] leading-none text-muted-foreground">
                        {fmtTime(new Date(reply.createdAt))}
                    </span>
                    {reply.editedAt && (
                        <span className="text-[10.5px] leading-none text-muted-foreground">
                            изменено
                        </span>
                    )}
                </div>
                {reply.body && (
                    <div className="mt-0.5 text-[12.5px] leading-[1.45] break-words whitespace-pre-wrap text-neutral-200">
                        <MessageText body={reply.body} />
                    </div>
                )}
                <MessageAttachments
                    attachments={reply.attachments}
                    own={false}
                />
            </div>

            {!pending && (own || canDelete) && (
                <div className="absolute top-0.5 right-1 flex gap-0.5 rounded-md bg-popover p-0.5 opacity-0 outline outline-foreground/12 transition-opacity group-hover/reply:opacity-100 focus-within:opacity-100">
                    {own && (
                        <ToolbarButton
                            label="Редактировать"
                            onClick={onEdit}
                        >
                            <Pencil />
                        </ToolbarButton>
                    )}
                    {canDelete && (
                        <ToolbarButton
                            label="Удалить"
                            onClick={onDelete}
                            destructive
                        >
                            <Trash2 />
                        </ToolbarButton>
                    )}
                </div>
            )}
        </div>
    );
};
