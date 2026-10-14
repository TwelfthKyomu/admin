'use client';

import { useState } from 'react';
import { cn } from '@/shared/lib/utils';
import type { ChatChannelsView, ChatTarget, ChatUserView } from '@/contexts/chat';
import { useChatPane } from '../../hooks/useChatPane';
import type { ChatTypingUser } from '../../hooks/useChatTyping';
import { type ChatConversation, composerPlaceholder } from '../../lib/conversation';
import { Composer } from '../Composer';
import { Feed } from './Feed';
import { PaneHeader } from './Header';
import { PinnedBar } from './PinnedBar';

export interface ChatPaneProps {
    organizationId: string;
    channels: ChatChannelsView;
    conversation: ChatConversation;
    target: ChatTarget;
    scope: string;
    viewer: ChatUserView;
    typists: ChatTypingUser[];
    hidden: boolean;
    onTyping: () => void;
    onOpenThread: (messageId: string) => void;
    onOpenProfile: (userId: string) => void;
    onToggleCard: () => void;
    onBack: () => void;
    focusMessageId?: string;
    onFocusHandled: () => void;
}

export const PaneBody = ({
    organizationId,
    channels,
    conversation,
    target,
    scope,
    viewer,
    typists,
    hidden,
    onTyping,
    onOpenThread,
    onOpenProfile,
    onToggleCard,
    onBack,
    focusMessageId,
    onFocusHandled,
}: ChatPaneProps) => {
    const pane = useChatPane({
        organizationId,
        target,
        scope,
        unreadCount: channels.unread[scope] ?? 0,
        viewer,
        focusMessageId,
        onFocusHandled,
    });

    const [dragging, setDragging] = useState(false);

    const canModerate = channels.canManage;
    const canPin = canModerate || target.kind === 'direct';
    const togglePin = canPin ? pane.actions.togglePin : undefined;

    return (
        // biome-ignore lint/a11y/noStaticElementInteractions: перетаскивание файла дублирует кнопку «Прикрепить файл», доступную с клавиатуры
        <section
            className={cn(
                'min-w-0 flex-1 flex-col overflow-hidden @3xl/chat:flex',
                hidden ? 'hidden' : 'flex',
                dragging && 'ring-2 ring-inset ring-primary/40',
            )}
            onDragOver={(event) => {
                if (!event.dataTransfer.types.includes('Files')) return;

                event.preventDefault();
                setDragging(true);
            }}
            onDragLeave={(event) => {
                const next = event.relatedTarget;

                if (next instanceof Node && event.currentTarget.contains(next)) return;

                setDragging(false);
            }}
            onDrop={(event) => {
                setDragging(false);

                if (event.dataTransfer.files.length === 0) return;

                event.preventDefault();
                pane.composer.addFiles([...event.dataTransfer.files]);
            }}
        >
            <PaneHeader
                conversation={conversation}
                onBack={onBack}
                onToggleCard={onToggleCard}
            />

            <PinnedBar
                messages={pane.pinned}
                onJumpTo={pane.jumpToMessage}
                onUnpin={togglePin}
            />

            <Feed
                pane={pane}
                viewerId={viewer.id}
                showAuthors={!conversation.direct}
                canModerate={canModerate}
                othersReadAt={channels.readByOthers[scope]}
                typists={typists}
                onOpenProfile={onOpenProfile}
                onOpenThread={onOpenThread}
                onTogglePin={togglePin}
            />

            <Composer
                value={pane.composer.draft}
                onChange={pane.composer.changeDraft}
                onSubmit={pane.composer.submit}
                canSubmit={pane.composer.canSubmit}
                attachments={pane.composer.attachments}
                onAddFiles={pane.composer.addFiles}
                onRemoveAttachment={pane.composer.removeAttachment}
                onTyping={onTyping}
                onEditLast={pane.composer.editLastOwnMessage}
                isPending={pane.composer.isPending}
                replyTo={pane.composer.replyTo}
                onCancelReply={pane.composer.cancelReply}
                editing={pane.composer.editing}
                onCancelEdit={pane.composer.cancelEdit}
                placeholder={composerPlaceholder(conversation)}
            />
        </section>
    );
};
