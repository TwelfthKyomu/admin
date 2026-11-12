'use client';

import { restoreQueries, snapshotQueries } from '@/shared/lib/queryCache';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { markChatReadAction } from './Chat.actions';
import {
    type ChatTarget,
    chatScopeKey,
    setMessageReaction,
} from './Chat.types';
import {
    sendChatMessageAction,
    setChatReactionAction,
} from './ChatMessage.actions';
import { type ChatSendInput, pendingMessage } from './ChatPending.types';
import type { ChatMessageView, ChatThreadView, ChatUserView } from './index';
import { chatQueries } from './useChats';

export const useSendChatMessage = (
    organizationId: string,
    target: ChatTarget,
    author: ChatUserView,
) => {
    const queryClient = useQueryClient();
    const scope = chatScopeKey(organizationId, target);
    const messagesKey = chatQueries.messages(scope);
    const threadKey = chatQueries.thread(scope);

    return useMutation({
        mutationFn: ({ attachments: _attachments, ...input }: ChatSendInput) =>
            sendChatMessageAction(input),
        meta: { invalidatesAll: false },
        onMutate: async (input: ChatSendInput) => {
            const previous = await snapshotQueries(queryClient, [
                messagesKey,
                threadKey,
            ]);

            if (input.threadRootId) {
                queryClient.setQueriesData<ChatThreadView | null>(
                    { queryKey: threadKey },
                    (thread) => {
                        if (!thread || thread.root.id !== input.threadRootId) {
                            return thread;
                        }

                        const pending = pendingMessage(input, author, [
                            thread.root,
                            ...thread.replies,
                        ]);

                        return {
                            root: thread.root,
                            replies: [...thread.replies, pending],
                        };
                    },
                );
            } else {
                queryClient.setQueriesData<ChatMessageView[]>(
                    { queryKey: messagesKey },
                    (messages) =>
                        messages && [
                            ...messages,
                            pendingMessage(input, author, messages),
                        ],
                );
            }

            return { previous };
        },
        onError: (_error, _input, context) =>
            restoreQueries(queryClient, context?.previous),
        onSettled: () => {
            void queryClient.invalidateQueries({
                queryKey: chatQueries.all,
                predicate: (query) => query.queryKey.includes(scope),
            });
        },
    });
};

export const useSetChatReaction = (scope: string) => {
    const queryClient = useQueryClient();
    const messagesKey = chatQueries.messages(scope);
    const threadKey = chatQueries.thread(scope);

    return useMutation({
        mutationFn: setChatReactionAction,
        meta: { invalidatesAll: false },
        onMutate: async ({ messageId, emoji }) => {
            const previous = await snapshotQueries(queryClient, [
                messagesKey,
                threadKey,
            ]);

            const patch = (message: ChatMessageView) =>
                message.id === messageId
                    ? setMessageReaction(message, emoji)
                    : message;

            queryClient.setQueriesData<ChatMessageView[]>(
                { queryKey: messagesKey },
                (messages) => messages?.map(patch),
            );

            queryClient.setQueriesData<ChatThreadView | null>(
                { queryKey: threadKey },
                (thread) =>
                    thread && {
                        root: patch(thread.root),
                        replies: thread.replies.map(patch),
                    },
            );

            return { previous };
        },
        onError: (_error, _input, context) =>
            restoreQueries(queryClient, context?.previous),
        onSettled: () => {
            void queryClient.invalidateQueries({ queryKey: messagesKey });
            void queryClient.invalidateQueries({ queryKey: threadKey });
        },
    });
};

export const useMarkChatRead = (organizationId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: markChatReadAction,
        meta: { invalidatesAll: false },
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: chatQueries.channels(organizationId),
            });
        },
    });
};
