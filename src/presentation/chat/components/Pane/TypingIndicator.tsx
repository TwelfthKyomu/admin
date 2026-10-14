'use client';

import type { ChatTypingUser } from '../../hooks/useChatTyping';
import { typingLabel } from '../../lib/typing';
import { ChatAvatar } from '../ChatAvatar';

interface TypingIndicatorProps {
    typists: ChatTypingUser[];
}

export const TypingIndicator = ({ typists }: TypingIndicatorProps) => {
    const first = typists[0];

    if (!first) return null;

    return (
        <div className="flex items-center gap-2.5 pt-1.5 pb-0.5">
            <ChatAvatar
                size="sm"
                name={first.name}
                seed={first.userId}
            />
            <span className="inline-flex items-center gap-1 rounded-[14px] border border-border bg-card px-[13px] py-[11px]">
                <span className="size-[5px] animate-typing-dot rounded-full bg-muted-foreground" />
                <span className="size-[5px] animate-typing-dot rounded-full bg-muted-foreground [animation-delay:180ms]" />
                <span className="size-[5px] animate-typing-dot rounded-full bg-muted-foreground [animation-delay:360ms]" />
            </span>
            <span className="truncate text-[11.5px] leading-none text-muted-foreground">
                {typingLabel(typists)}
            </span>
        </div>
    );
};
