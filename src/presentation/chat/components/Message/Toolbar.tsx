'use client';

import { cn } from '@/shared/lib/utils';
import { CHAT_REACTIONS, type ChatReaction } from '@/contexts/chat';
import { Button, Dropdown } from '@/ui/Base';
import {
    Copy,
    Link2,
    List,
    MessageSquare,
    MoreHorizontal,
    Pencil,
    Pin,
    PinOff,
    Plus,
    Trash2,
} from 'lucide-react';
import { useOpenMenus } from '../../hooks/useOpenMenus';
import { ToolbarButton } from './ToolbarButton';

interface MessageToolbarProps {
    own: boolean;
    topmost: boolean;
    canEdit: boolean;
    canDelete: boolean;
    ownReaction?: string;
    pinned: boolean;
    onReact: (emoji: ChatReaction) => void;
    onReply: () => void;
    onCopy: () => void;
    onCopyLink: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onOpenThread?: () => void;
    onCreateTask?: () => void;
    onTogglePin?: () => void;
}

export const MessageToolbar = ({
    own,
    topmost,
    canEdit,
    canDelete,
    ownReaction,
    pinned,
    onReact,
    onReply,
    onCopy,
    onCopyLink,
    onEdit,
    onDelete,
    onOpenThread,
    onCreateTask,
    onTogglePin,
}: MessageToolbarProps) => {
    const menus = useOpenMenus();

    return (
        <div
            className={cn(
                'absolute z-[25] flex items-center gap-0.5 rounded-[9px] bg-popover p-[3px] shadow-[0_6px_18px_rgb(0_0_0/0.45)] outline outline-foreground/12 transition-opacity',
                topmost ? 'top-0.5' : '-top-4',
                own ? 'right-[38px]' : 'left-[38px]',
                menus.anyOpen
                    ? 'opacity-100'
                    : 'pointer-events-none opacity-0 focus-within:pointer-events-auto focus-within:opacity-100 group-hover/message:pointer-events-auto group-hover/message:opacity-100',
            )}
        >
            {CHAT_REACTIONS.map((emoji) => (
                <Button
                    key={emoji}
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => onReact(emoji)}
                    aria-pressed={ownReaction === emoji}
                    aria-label={`Реакция ${emoji}`}
                    className={cn(
                        'px-[7px] text-[13px]',
                        ownReaction === emoji && 'bg-violet-500/20',
                    )}
                >
                    {emoji}
                </Button>
            ))}

            <span className="mx-0.5 h-[18px] w-px bg-foreground/12" />

            <ToolbarButton
                label="Ответить"
                onClick={onReply}
            >
                <MessageSquare />
            </ToolbarButton>
            {onOpenThread && (
                <ToolbarButton
                    label="Открыть тред"
                    onClick={onOpenThread}
                >
                    <List />
                </ToolbarButton>
            )}
            {onCreateTask && (
                <ToolbarButton
                    label="Создать задачу"
                    onClick={onCreateTask}
                >
                    <Plus />
                </ToolbarButton>
            )}
            {canEdit && (
                <ToolbarButton
                    label="Редактировать"
                    onClick={onEdit}
                >
                    <Pencil />
                </ToolbarButton>
            )}
            {canDelete && (
                <ToolbarButton
                    label="Удалить"
                    onClick={onDelete}
                    destructive
                >
                    <Trash2 />
                </ToolbarButton>
            )}

            <Dropdown
                align="end"
                onOpenChange={menus.track}
                trigger={
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        aria-label="Ещё"
                    >
                        <MoreHorizontal className="size-3.5" />
                    </Button>
                }
            >
                <Dropdown.Item onClick={onCopy}>
                    <Copy /> Копировать текст
                </Dropdown.Item>
                <Dropdown.Item onClick={onCopyLink}>
                    <Link2 /> Копировать ссылку
                </Dropdown.Item>
                {onTogglePin && (
                    <Dropdown.Item onClick={onTogglePin}>
                        {pinned ? <PinOff /> : <Pin />}
                        {pinned ? 'Открепить' : 'Закрепить'}
                    </Dropdown.Item>
                )}
            </Dropdown>
        </div>
    );
};
