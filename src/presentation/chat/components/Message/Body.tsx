'use client';

import { cn } from '@/shared/lib/utils';
import type { ChatMessageView } from '@/contexts/chat';
import { Bubble, BubbleContent } from '@/ui/Base';
import { MessageAttachments } from './Attachments';
import { MessageMeta } from './Meta';
import { ReplyQuote } from './ReplyQuote';
import { MessageText } from './Text';

interface MessageBodyProps {
    message: ChatMessageView;
    own: boolean;
    editing: boolean;
    highlighted: boolean;
    status?: 'sent' | 'read';
    onJumpTo: (messageId: string) => void;
}

export const MessageBody = ({
    message,
    own,
    editing,
    highlighted,
    status,
    onJumpTo,
}: MessageBodyProps) => {
    const replyTo = message.replyTo;

    return (
        <Bubble
            variant={own ? 'default' : 'outline'}
            align={own ? 'end' : 'start'}
            className={cn(
                'max-w-full',
                !own && '*:data-[slot=bubble-content]:bg-card',
                editing && '*:data-[slot=bubble-content]:border-amber-300',
            )}
        >
            <BubbleContent
                className={cn(
                    'rounded-[14px] px-3 py-[9px] text-[13.5px] leading-normal text-pretty transition-shadow',
                    own ? 'rounded-br-[4px]' : 'rounded-bl-[4px]',
                    highlighted && 'ring-2 ring-violet-400/50',
                )}
            >
                {replyTo && (
                    <ReplyQuote
                        reply={replyTo}
                        own={own}
                        onClick={() => onJumpTo(replyTo.id)}
                    />
                )}
                {message.body.length > 0 && (
                    <div className="whitespace-pre-wrap break-words">
                        <MessageText body={message.body} />
                    </div>
                )}
                <MessageAttachments
                    attachments={message.attachments}
                    own={own}
                />
                <MessageMeta
                    createdAt={message.createdAt}
                    edited={!!message.editedAt}
                    status={status}
                />
            </BubbleContent>
        </Bubble>
    );
};
