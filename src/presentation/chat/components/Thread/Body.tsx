'use client';

import type { ChatTarget, ChatUserView } from '@/contexts/chat';
import { MessageScroller, MessageScrollerContent, MessageScrollerViewport } from '@/ui/Base';
import { useChatThreadPanel } from '../../hooks/useChatThread';
import { ThreadComposer } from './Composer';
import { ThreadReplies } from './Replies';
import { ThreadRoot } from './Root';

export interface ThreadBodyProps {
    organizationId: string;
    target: ChatTarget;
    scope: string;
    rootMessageId: string;
    viewer: ChatUserView;
    canModerate: boolean;
}

export const ThreadBody = ({
    organizationId,
    target,
    scope,
    rootMessageId,
    viewer,
    canModerate,
}: ThreadBodyProps) => {
    const panel = useChatThreadPanel({
        organizationId,
        target,
        scope,
        rootMessageId,
        viewer,
    });

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <div className="shrink-0 border-b border-border p-3">
                <div className="mb-[7px] text-[10px] leading-[1.2] font-medium tracking-[0.05em] text-muted-foreground uppercase">
                    Исходное сообщение
                </div>
                <ThreadRoot
                    root={panel.thread?.root}
                    isPending={panel.isPending}
                />
            </div>

            <MessageScroller className="min-h-0 flex-1">
                <MessageScrollerViewport>
                    <MessageScrollerContent className="gap-1 p-3">
                        <ThreadReplies
                            replies={panel.replies}
                            viewerId={viewer.id}
                            canModerate={canModerate}
                            editingId={panel.composer.editing?.id}
                            onEdit={panel.composer.startEdit}
                            onDelete={panel.actions.deleteMessage}
                        />
                    </MessageScrollerContent>
                </MessageScrollerViewport>
            </MessageScroller>

            <ThreadComposer composer={panel.composer} />
        </div>
    );
};
