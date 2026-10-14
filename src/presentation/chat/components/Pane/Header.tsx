import { Button } from '@/ui/Base';
import { ArrowLeft, PanelRight } from 'lucide-react';
import type { ChatConversation } from '../../lib/conversation';
import { ChannelChip } from '../ChannelChip';
import { ChatAvatar } from '../ChatAvatar';

interface PaneHeaderProps {
    conversation: ChatConversation;
    onBack: () => void;
    onToggleCard: () => void;
}

export const PaneHeader = ({ conversation, onBack, onToggleCard }: PaneHeaderProps) => (
    <header className="flex h-[58px] shrink-0 items-center gap-2.5 border-b border-border px-3.5">
        <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="rounded-lg @3xl/chat:hidden"
            onClick={onBack}
            aria-label="К списку"
            title="К списку"
        >
            <ArrowLeft className="size-[15px]" />
        </Button>
        <ChatAvatar
            size="md"
            name={conversation.title}
            image={conversation.image}
            seed={conversation.userId}
            initials={conversation.initials}
        />
        <div className="flex min-w-0 flex-col gap-0.5">
            <div className="flex min-w-0 items-center gap-[7px]">
                <span className="truncate text-[14px] leading-[1.2] font-semibold">
                    {conversation.title}
                </span>
                <ChannelChip direct={conversation.direct} />
            </div>
            <span className="truncate text-[11.5px] leading-none text-muted-foreground">
                {conversation.subtitle}
            </span>
        </div>
        <div className="flex-1" />
        <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="rounded-lg @6xl/chat:hidden"
            onClick={onToggleCard}
            aria-label="Карточка"
            title="Карточка"
        >
            <PanelRight className="size-[15px]" />
        </Button>
    </header>
);
