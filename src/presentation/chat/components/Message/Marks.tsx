'use client';

import { ROUTES } from '@/shared/constants';
import { cn } from '@/shared/lib/utils';
import { type ChatMessageView, type ChatReaction, isChatReaction } from '@/contexts/chat';
import { ListChecks, MessageSquare, Pin } from 'lucide-react';
import Link from 'next/link';
import { taskKeyLabel } from '../../lib/task';

interface MessageMarksProps {
    message: ChatMessageView;
    disabled: boolean;
    onReact: (emoji: ChatReaction) => void;
    onOpenThread?: () => void;
}

export const MessageMarks = ({ message, disabled, onReact, onOpenThread }: MessageMarksProps) => {
    const { reactions, task } = message;
    const hasThread = !!onOpenThread && message.threadReplies > 0;

    if (reactions.length === 0 && !hasThread && !task && !message.pinnedAt) return null;

    return (
        <div className="flex flex-wrap items-center gap-1.5">
            {reactions.map((reaction) => {
                const known = isChatReaction(reaction.emoji) ? reaction.emoji : undefined;

                return (
                    <button
                        key={reaction.emoji}
                        type="button"
                        disabled={disabled || !known}
                        onClick={known ? () => onReact(known) : undefined}
                        aria-pressed={reaction.reacted}
                        className={cn(
                            'inline-flex h-[22px] items-center gap-[5px] rounded-full border px-2 text-[11px] leading-none font-medium transition-colors disabled:opacity-50',
                            reaction.reacted
                                ? 'border-violet-500/40 bg-violet-500/20 text-violet-300'
                                : 'border-border bg-foreground/5 text-neutral-300 hover:bg-foreground/10',
                        )}
                    >
                        <span>{reaction.emoji}</span>
                        <span className="font-mono opacity-70">{reaction.count}</span>
                    </button>
                );
            })}

            {hasThread && (
                <button
                    type="button"
                    onClick={onOpenThread}
                    className="inline-flex h-[22px] items-center gap-[5px] rounded-full border border-foreground/12 px-2 text-[11px] leading-none font-medium text-violet-400 transition-colors hover:bg-foreground/5"
                >
                    <MessageSquare className="size-3" />
                    Тред · {message.threadReplies}
                </button>
            )}

            {task && (
                <Link
                    href={ROUTES.project(task.projectId, 'tasks')}
                    className="inline-flex h-[22px] items-center gap-[5px] rounded-full bg-emerald-500/18 px-2 text-[11px] leading-none font-medium text-emerald-500 hover:bg-emerald-500/25"
                >
                    <ListChecks className="size-3" />
                    <span className="font-mono">{taskKeyLabel(task.projectKey, task.number)}</span>
                </Link>
            )}

            {message.pinnedAt && (
                <span className="inline-flex h-[22px] items-center gap-1 px-1 text-[11px] leading-none text-muted-foreground">
                    <Pin className="size-3" />
                    Закреплено
                </span>
            )}
        </div>
    );
};
