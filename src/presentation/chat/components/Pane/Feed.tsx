'use client';

import type { ChatMessageView } from '@/contexts/chat';
import {
    MessageScroller,
    MessageScrollerButton,
    MessageScrollerContent,
    MessageScrollerViewport,
} from '@/ui/Base';
import { ArrowDown } from 'lucide-react';
import type { useChatPane } from '../../hooks/useChatPane';
import type { ChatTypingUser } from '../../hooks/useChatTyping';
import { FeedBody } from './FeedBody';
import { TypingIndicator } from './TypingIndicator';

interface FeedProps {
    pane: ReturnType<typeof useChatPane>;
    viewerId: string;
    showAuthors: boolean;
    canModerate: boolean;
    othersReadAt?: Date;
    typists: ChatTypingUser[];
    onOpenProfile: (userId: string) => void;
    onOpenThread: (messageId: string) => void;
    onTogglePin?: (message: ChatMessageView) => void;
}

export const Feed = ({ pane, typists, ...bodyProps }: FeedProps) => (
    <MessageScroller className="min-h-0 flex-1">
        <MessageScrollerViewport preserveScrollOnPrepend>
            <MessageScrollerContent className="gap-0.5 px-[18px] pt-4 pb-3.5">
                <FeedBody
                    pane={pane}
                    {...bodyProps}
                />
                <TypingIndicator typists={typists} />
            </MessageScrollerContent>
        </MessageScrollerViewport>

        {pane.messages.length > 0 && (
            <MessageScrollerButton
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 rounded-full shadow-sm"
            >
                <ArrowDown className="size-3.5" />
                {pane.newBelow > 0 ? `Новых: ${pane.newBelow}` : 'Вниз'}
            </MessageScrollerButton>
        )}
    </MessageScroller>
);
