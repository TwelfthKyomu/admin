'use client';

import {
    type QueryClient,
    type QueryKey,
    useMutation,
    useQueryClient,
} from '@tanstack/react-query';
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
import type {
    ChatAttachmentView,
    ChatMessageView,
    ChatThreadView,
    ChatUserView,
} from './index';
import { chatQueries } from './useChats';

async function snapshotChat(
    queryClient: QueryClient,
    keys: QueryKey[],
): Promise<[QueryKey, unknown][]> {
    await Promise.all(
        keys.map((queryKey) => queryClient.cancelQueries({ queryKey })),
    );

    return keys.flatMap((queryKey) => queryClient.getQueriesData({ queryKey }));
}

function restoreChat(
    queryClient: QueryClient,
    snapshot: [QueryKey, unknown][] = [],
): void {
    for (const [key, data] of snapshot) queryClient.setQueryData(key, data);
}

const PENDING_PREFIX = 'pending:';

export function isPendingMessage(id: string) {
    return id.startsWith(PENDING_PREFIX);
}

type SendInput = Parameters<typeof sendChatMessageAction>[0] & {
    attachments?: ChatAttachmentView[];
};

function pendingMessage(
    input: SendInput,
    author: ChatUserView,
    loaded: ChatMessageView[],
): ChatMessageView {
    const replyTo = loaded.find((message) => message.id === input.replyToId);

    return {
        id: `${PENDING_PREFIX}${crypto.randomUUID()}`,
        channelId: '',
        authorUserId: author.id,
        authorName: author.name,
        authorImage: author.image,
        body: input.body,
        createdAt: new Date(),
        replyTo: replyTo && {
            id: replyTo.id,
            authorName: replyTo.authorName,
            body: replyTo.body,
        },
        reactions: [],
        attachments: input.attachments ?? [],
        threadReplies: 0,
    };
}

export function useSendChatMessage(
    organizationId: string,
    target: ChatTarget,
    author: ChatUserView,
) {
    const queryClient = useQueryClient();
    const scope = chatScopeKey(organizationId, target);
    const messagesKey = chatQueries.messages(scope);
    const threadKey = chatQueries.thread(scope);

    return useMutation({
        mutationFn: ({ attachments: _attachments, ...input }: SendInput) =>
            sendChatMessageAction(input),
        meta: { invalidatesAll: false },
        onMutate: async (input: SendInput) => {
            const previous = await snapshotChat(queryClient, [
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
            restoreChat(queryClient, context?.previous),
        onSettled: () => {
            void queryClient.invalidateQueries({
                queryKey: chatQueries.all,
                predicate: (query) => query.queryKey.includes(scope),
            });
        },
    });
}

export function useSetChatReaction(scope: string) {
    const queryClient = useQueryClient();
    const messagesKey = chatQueries.messages(scope);
    const threadKey = chatQueries.thread(scope);

    return useMutation({
        mutationFn: setChatReactionAction,
        meta: { invalidatesAll: false },
        onMutate: async ({ messageId, emoji }) => {
            const previous = await snapshotChat(queryClient, [
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
            restoreChat(queryClient, context?.previous),
        onSettled: () => {
            void queryClient.invalidateQueries({ queryKey: messagesKey });
            void queryClient.invalidateQueries({ queryKey: threadKey });
        },
    });
}

export function useMarkChatRead(organizationId: string) {
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
}
