'use client';

import { useEffect, useRef } from 'react';
import {
    type ChatTarget,
    type ChatUserView,
    useChatThread as useChatThreadQuery,
} from '@/contexts/chat';
import { useMessageScroller } from '@/ui/Base';
import { useChatComposer } from './useChatComposer';
import { useMessageActions } from './useMessageActions';
import { useMessageHighlight } from './useMessageHighlight';

interface UseChatThreadPanelOptions {
    organizationId: string;
    target: ChatTarget;
    scope: string;
    rootMessageId: string;
    viewer: ChatUserView;
}

export function useChatThreadPanel({
    organizationId,
    target,
    scope,
    rootMessageId,
    viewer,
}: UseChatThreadPanelOptions) {
    const threadQuery = useChatThreadQuery(scope, rootMessageId);
    const thread = threadQuery.data;
    const replies = thread?.replies ?? [];

    const { scrollToEnd } = useMessageScroller();
    const { highlightId, jumpTo } = useMessageHighlight();
    const positioned = useRef(false);

    useEffect(() => {
        if (threadQuery.isPending || positioned.current) return;

        positioned.current = true;
        scrollToEnd({ behavior: 'instant' });
    }, [threadQuery.isPending]);

    const composer = useChatComposer({
        organizationId,
        target,
        scope,
        threadRootId: rootMessageId,
        viewer,
        messages: replies,
        onSent: () => scrollToEnd(),
    });

    const actions = useMessageActions({ target, scope });

    return {
        thread,
        replies,
        isPending: threadQuery.isPending,
        highlightId,
        jumpToMessage: jumpTo,
        composer,
        actions,
    };
}
