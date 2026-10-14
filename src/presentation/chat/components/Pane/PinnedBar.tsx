'use client';

import { useState } from 'react';
import { pluralRu } from '@/shared/format/plural';
import type { ChatMessageView } from '@/contexts/chat';
import { Button } from '@/ui/Base';
import { Pin, X } from 'lucide-react';
import { ATTACHMENT_ONLY_BODY, DELETED_AUTHOR, MESSAGES_PLURAL } from '../../lib/text';

interface PinnedBarProps {
    messages: ChatMessageView[];
    onJumpTo: (messageId: string) => void;
    onUnpin?: (message: ChatMessageView) => void;
}

export const PinnedBar = ({ messages, onJumpTo, onUnpin }: PinnedBarProps) => {
    const [index, setIndex] = useState(0);

    if (messages.length === 0) return null;

    const current = messages[index % messages.length];

    if (!current) return null;

    return (
        <div className="flex shrink-0 items-center gap-2 border-b border-border bg-card/40 px-4 py-1.5">
            <Pin className="size-3.5 shrink-0 text-muted-foreground" />
            <button
                type="button"
                onClick={() => {
                    onJumpTo(current.id);
                    setIndex((previous) => previous + 1);
                }}
                className="min-w-0 flex-1 text-left"
            >
                <span className="block text-[11px] font-medium text-muted-foreground">
                    Закреплённое
                    {messages.length > 1 &&
                        ` · ${messages.length} ${pluralRu(messages.length, MESSAGES_PLURAL)}`}
                </span>
                <span className="block truncate text-[12px]">
                    {current.authorName ?? DELETED_AUTHOR}: {current.body || ATTACHMENT_ONLY_BODY}
                </span>
            </button>
            {onUnpin && (
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-6 shrink-0 text-muted-foreground"
                    onClick={() => onUnpin(current)}
                    aria-label="Открепить сообщение"
                >
                    <X className="size-3.5" />
                </Button>
            )}
        </div>
    );
};
