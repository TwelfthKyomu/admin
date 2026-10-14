'use client';

import { cn } from '@/shared/lib/utils';
import { type ChatMessageView, isPendingMessage } from '@/contexts/chat';
import {
    Message,
    MessageAvatar,
    MessageContent,
    MessageHeader,
    MessageScrollerItem,
} from '@/ui/Base';
import type { MessageHandlers } from '../../lib/messageHandlers';
import { ChatAvatar } from '../ChatAvatar';
import { MessageBody } from './Body';
import { MessageMarks } from './Marks';
import { ProfileTrigger } from './ProfileTrigger';
import { MessageToolbar } from './Toolbar';

interface MessageRowProps extends MessageHandlers {
    message: ChatMessageView;
    authorName: string;
    authorImage?: string;
    own: boolean;
    showAuthor: boolean;
    topmost: boolean;
    read: boolean;
    canModerate: boolean;
    editing: boolean;
    highlighted: boolean;
}

export const MessageRow = ({
    message,
    authorName,
    authorImage,
    own,
    showAuthor,
    topmost,
    read,
    canModerate,
    editing,
    highlighted,
    onReply,
    onReact,
    onCopy,
    onCopyLink,
    onEdit,
    onDelete,
    onJumpTo,
    onOpenProfile,
    onOpenThread,
    onTogglePin,
    onCreateTask,
}: MessageRowProps) => {
    const pending = isPendingMessage(message.id);
    const ownReaction = message.reactions.find((reaction) => reaction.reacted)?.emoji;

    return (
        <MessageScrollerItem
            messageId={message.id}
            className="[content-visibility:visible]"
        >
            <Message
                align={own ? 'end' : 'start'}
                className={cn(
                    '-mx-1.5 w-auto items-end gap-2.5 rounded-xl px-1.5 py-1 transition-colors hover:bg-foreground/5',
                    editing && 'bg-foreground/5',
                )}
            >
                {!own && (
                    <MessageAvatar className="min-w-7 rounded-lg bg-transparent">
                        <ProfileTrigger
                            userId={message.authorUserId}
                            onOpenProfile={onOpenProfile}
                            label={`Профиль: ${authorName}`}
                        >
                            <ChatAvatar
                                size="sm"
                                name={authorName}
                                image={authorImage}
                                seed={message.authorUserId ?? authorName}
                            />
                        </ProfileTrigger>
                    </MessageAvatar>
                )}

                <MessageContent
                    className={cn(
                        'w-fit max-w-[min(620px,74%)] gap-1',
                        own ? 'items-end' : 'items-start',
                        pending && 'opacity-60',
                    )}
                >
                    {showAuthor && (
                        <MessageHeader className="px-0.5 text-[11.5px] leading-none">
                            {authorName}
                        </MessageHeader>
                    )}
                    <MessageBody
                        message={message}
                        own={own}
                        editing={editing}
                        highlighted={highlighted}
                        status={own && !pending ? (read ? 'read' : 'sent') : undefined}
                        onJumpTo={onJumpTo}
                    />
                    <MessageMarks
                        message={message}
                        disabled={pending}
                        onReact={(emoji) => onReact(message.id, emoji)}
                        onOpenThread={onOpenThread && (() => onOpenThread(message.id))}
                    />
                </MessageContent>

                {!pending && (
                    <MessageToolbar
                        own={own}
                        topmost={topmost}
                        canEdit={own}
                        canDelete={own || canModerate}
                        ownReaction={ownReaction}
                        pinned={!!message.pinnedAt}
                        onReact={(emoji) => onReact(message.id, emoji)}
                        onReply={() => onReply(message)}
                        onCopy={() => onCopy(message.body)}
                        onCopyLink={() => onCopyLink(message.id)}
                        onEdit={() => onEdit(message)}
                        onDelete={() => onDelete(message.id)}
                        onOpenThread={onOpenThread && (() => onOpenThread(message.id))}
                        onCreateTask={
                            onCreateTask && !message.task ? () => onCreateTask(message) : undefined
                        }
                        onTogglePin={onTogglePin && (() => onTogglePin(message))}
                    />
                )}
            </Message>
        </MessageScrollerItem>
    );
};
