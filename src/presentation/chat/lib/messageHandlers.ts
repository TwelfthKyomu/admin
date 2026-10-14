import type { ChatMessageView, ChatReaction } from '@/contexts/chat';
import type { ChatComposer } from '../hooks/useChatComposer';
import type { useMessageActions } from '../hooks/useMessageActions';

export interface MessageHandlers {
    onReply: (message: ChatMessageView) => void;
    onReact: (messageId: string, emoji: ChatReaction) => void;
    onCopy: (body: string) => void;
    onCopyLink: (messageId: string) => void;
    onEdit: (message: ChatMessageView) => void;
    onDelete: (messageId: string) => void;
    onJumpTo: (messageId: string) => void;
    onOpenProfile: (userId: string) => void;
    onOpenThread?: (messageId: string) => void;
    onTogglePin?: (message: ChatMessageView) => void;
    onCreateTask?: (message: ChatMessageView) => void;
}

interface HandlerSource {
    composer: ChatComposer;
    actions: ReturnType<typeof useMessageActions>;
}

export function messageHandlers(
    source: HandlerSource,
    onJumpTo: (messageId: string) => void,
    onOpenProfile: (userId: string) => void,
): MessageHandlers {
    return {
        onReply: source.composer.startReply,
        onEdit: source.composer.startEdit,
        onReact: source.actions.setReaction,
        onCopy: source.actions.copyMessage,
        onCopyLink: source.actions.copyMessageLink,
        onDelete: source.actions.deleteMessage,
        onCreateTask: source.actions.createTask,
        onJumpTo,
        onOpenProfile,
    };
}
