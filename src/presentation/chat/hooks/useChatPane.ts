'use client';

import { useEffect, useRef, useState } from 'react';
import { PAGE_SIZE_DEFAULT, PAGE_SIZE_LIMIT } from '@/shared/constants/default';
import { toast } from '@/shared/lib/toast';
import {
    type ChatMessageView,
    type ChatTarget,
    type ChatUserView,
    useChatMessages,
    useChatPinned,
    useMarkChatRead,
} from '@/contexts/chat';
import { useMessageScroller, useMessageScrollerScrollable } from '@/ui/Base';
import { useChatComposer } from './useChatComposer';
import { useMessageActions } from './useMessageActions';
import { useMessageHighlight } from './useMessageHighlight';

const NO_MESSAGES: ChatMessageView[] = [];

function usePageVisible(): boolean {
    const [visible, setVisible] = useState(
        () =>
            typeof document === 'undefined' ||
            document.visibilityState === 'visible',
    );

    useEffect(() => {
        const sync = () => setVisible(document.visibilityState === 'visible');

        document.addEventListener('visibilitychange', sync);

        return () => document.removeEventListener('visibilitychange', sync);
    }, []);

    return visible;
}

interface UseChatPaneOptions {
    organizationId: string;
    target: ChatTarget;
    scope: string;
    unreadCount: number;
    viewer: ChatUserView;
    focusMessageId?: string;
    onFocusHandled: () => void;
}

export function useChatPane({
    organizationId,
    target,
    scope,
    unreadCount,
    viewer,
    focusMessageId,
    onFocusHandled,
}: UseChatPaneOptions) {
    const [limit, setLimit] = useState(PAGE_SIZE_DEFAULT);
    const [jumpToId, setJumpToId] = useState<string>();
    const [unreadAnchorId, setUnreadAnchorId] = useState<string>();
    const [newBelow, setNewBelow] = useState(0);

    const positioned = useRef(false);
    const markedUpTo = useRef<string>(undefined);
    const bottomAnchorId = useRef<string>(undefined);

    const pageVisible = usePageVisible();

    const messagesQuery = useChatMessages(scope, target, limit);
    const messages = messagesQuery.data ?? NO_MESSAGES;
    const { isPending, isFetching } = messagesQuery;
    const pinnedQuery = useChatPinned(scope, target);

    const { scrollToEnd, scrollToMessage } = useMessageScroller();
    const { end: canScrollDown } = useMessageScrollerScrollable();
    const atBottom = !canScrollDown;
    const { highlightId, jumpTo } = useMessageHighlight();

    const composer = useChatComposer({
        organizationId,
        target,
        scope,
        viewer,
        messages,
        onSent: () => scrollToEnd(),
    });

    const actions = useMessageActions({ target, scope });

    const { mutate: markAsRead, isPending: markReadPending } =
        useMarkChatRead(organizationId);

    const canLoadMore = messages.length >= limit && limit < PAGE_SIZE_LIMIT;

    const loadMore = () =>
        setLimit((current) =>
            Math.min(PAGE_SIZE_LIMIT, current + PAGE_SIZE_DEFAULT),
        );

    const jumpToMessage = (messageId: string) => {
        if (!jumpTo(messageId)) setJumpToId(messageId);
    };

    useEffect(() => {
        if (isPending || positioned.current) return;

        positioned.current = true;

        const firstUnread =
            unreadCount > 0
                ? messages[Math.max(0, messages.length - unreadCount)]
                : undefined;

        setUnreadAnchorId(firstUnread?.id);

        if (focusMessageId) return;

        const scrolled =
            firstUnread &&
            scrollToMessage(firstUnread.id, {
                align: 'start',
                behavior: 'instant',
            });

        if (!scrolled) scrollToEnd({ behavior: 'instant' });
    }, [isPending]);

    useEffect(() => {
        if (!focusMessageId || isPending) return;

        jumpToMessage(focusMessageId);
        onFocusHandled();
    }, [focusMessageId, isPending]);

    useEffect(() => {
        if (!jumpToId) return;

        if (jumpTo(jumpToId)) {
            setJumpToId(undefined);

            return;
        }

        if (isFetching) return;

        if (!canLoadMore) {
            setJumpToId(undefined);
            toast.error('Сообщение не найдено в загруженной истории');

            return;
        }

        loadMore();
    }, [jumpToId, messages, isFetching]);

    useEffect(() => {
        if (isPending || markReadPending || unreadCount === 0) return;
        if (!pageVisible || !atBottom) return;

        const lastId = messages.at(-1)?.id;

        if (!lastId || markedUpTo.current === lastId) return;

        markedUpTo.current = lastId;
        markAsRead({ target });
    }, [
        messages,
        unreadCount,
        isPending,
        markReadPending,
        pageVisible,
        atBottom,
    ]);

    useEffect(() => {
        if (atBottom) {
            bottomAnchorId.current = messages.at(-1)?.id;
            setNewBelow(0);

            return;
        }

        const index = messages.findIndex(
            (message) => message.id === bottomAnchorId.current,
        );

        setNewBelow(index === -1 ? 0 : messages.length - 1 - index);
    }, [messages, atBottom]);

    return {
        messages,
        pinned: pinnedQuery.data ?? NO_MESSAGES,
        isPending,
        isFetching,
        unreadAnchorId,
        highlightId,
        newBelow,
        canLoadMore,
        loadMore,
        jumpToMessage,
        composer,
        actions,
    };
}
