'use client';

import { cn } from '@/shared/lib/utils';
import type { ChatMessageReplyView } from '@/contexts/chat';
import { ATTACHMENT_ONLY_BODY, DELETED_AUTHOR, DELETED_BODY } from '../../lib/text';

interface ReplyQuoteProps {
    reply: ChatMessageReplyView;
    own: boolean;
    onClick: () => void;
}

export const ReplyQuote = ({ reply, own, onClick }: ReplyQuoteProps) => (
    <button
        type="button"
        onClick={onClick}
        className={cn(
            'mb-1.5 block w-full min-w-0 border-l-2 py-0.5 pl-2 text-left opacity-85 hover:opacity-100',
            own ? 'border-primary-foreground/40' : 'border-violet-500',
        )}
    >
        <span className="block truncate text-[11px] leading-[1.3] font-medium">
            {reply.authorName ?? DELETED_AUTHOR}
        </span>
        <span
            className={cn(
                'block max-w-80 truncate text-[11.5px] leading-[1.35]',
                reply.body === undefined && 'italic',
            )}
        >
            {reply.body === undefined ? DELETED_BODY : reply.body || ATTACHMENT_ONLY_BODY}
        </span>
    </button>
);
