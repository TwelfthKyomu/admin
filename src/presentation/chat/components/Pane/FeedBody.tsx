'use client';

import { PageLoader } from '@/shared/components/common';
import type { ChatMessageView } from '@/contexts/chat';
import { Button } from '@/ui/Base';
import type { useChatPane } from '../../hooks/useChatPane';
import { groupMessages } from '../../lib/messageGroups';
import { messageHandlers } from '../../lib/messageHandlers';
import { MessageList } from '../Message';

interface FeedBodyProps {
    pane: ReturnType<typeof useChatPane>;
    viewerId: string;
    showAuthors: boolean;
    canModerate: boolean;
    othersReadAt?: Date;
    onOpenProfile: (userId: string) => void;
    onOpenThread: (messageId: string) => void;
    onTogglePin?: (message: ChatMessageView) => void;
}

export const FeedBody = ({
    pane,
    viewerId,
    showAuthors,
    canModerate,
    othersReadAt,
    onOpenProfile,
    onOpenThread,
    onTogglePin,
}: FeedBodyProps) => {
    if (pane.isPending) return <PageLoader className="py-0" />;

    if (pane.messages.length === 0) {
        return (
            <div className="flex flex-1 items-center justify-center text-[13px] text-muted-foreground">
                Сообщений пока нет — напишите первым.
            </div>
        );
    }

    return (
        <>
            {pane.canLoadMore && (
                <div className="flex justify-center pb-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={pane.loadMore}
                        disabled={pane.isFetching}
                    >
                        Показать более ранние
                    </Button>
                </div>
            )}
            <MessageList
                groups={groupMessages(pane.messages, {
                    unreadAnchorId: pane.unreadAnchorId,
                })}
                ownUserId={viewerId}
                showAuthors={showAuthors}
                canModerate={canModerate}
                editingId={pane.composer.editing?.id}
                highlightId={pane.highlightId}
                othersReadAt={othersReadAt}
                {...messageHandlers(pane, pane.jumpToMessage, onOpenProfile)}
                onOpenThread={onOpenThread}
                onTogglePin={onTogglePin}
            />
        </>
    );
};
