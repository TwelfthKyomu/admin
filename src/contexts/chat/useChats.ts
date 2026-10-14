'use client';

import { SEARCH_QUERY_MIN } from '@/shared/constants/default';
import { makeScopedMutation } from '@/shared/lib/mutations';
import { itemQuery, listQuery } from '@/shared/lib/queries';
import { broadcastScope } from '@/shared/realtime/scope';
import {
    type QueryClient,
    type QueryKey,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import {
    chatAttachmentsAction,
    chatChannelsAction,
    chatContactsAction,
    chatLinksAction,
    chatMessageSearchAction,
    chatMessagesAction,
    chatPinnedAction,
    chatThreadAction,
    deleteChatMessageAction,
    editChatMessageAction,
    markChatReadAction,
    sendChatMessageAction,
    setChatMessagePinAction,
    setChatReactionAction,
    startDirectChatAction,
} from './Chat.actions';
import {
    type ChatTarget,
    chatChannelsScope,
    chatScopeKey,
    setMessageReaction,
} from './Chat.types';
import type {
    ChatAttachmentView,
    ChatMessageView,
    ChatThreadView,
    ChatUserView,
} from './index';

const chatQueries = {
    all: ['chat'] as const,
    channels: (organizationId: string) =>
        [
            ...chatQueries.all,
            'channels',
            chatChannelsScope(organizationId),
        ] as const,
    contacts: (organizationId: string) =>
        [...chatQueries.all, 'contacts', organizationId] as const,
    messages: (scope: string) =>
        [...chatQueries.all, 'messages', scope] as const,
    thread: (scope: string) => [...chatQueries.all, 'thread', scope] as const,
    pinned: (scope: string) => [...chatQueries.all, 'pinned', scope] as const,
    links: (scope: string) => [...chatQueries.all, 'links', scope] as const,
    attachments: (scope: string) =>
        [...chatQueries.all, 'attachments', scope] as const,
    search: (organizationId: string) =>
        [...chatQueries.all, 'search', organizationId] as const,
};

const SCOPE_INDEX = 2;

export function useChatChannels(organizationId: string) {
    return useQuery(
        itemQuery(chatQueries.channels(organizationId), chatChannelsAction, {
            staleTime: 15_000,
        }),
    );
}

export function useChatContacts(organizationId: string, enabled: boolean) {
    return useQuery(
        listQuery(chatQueries.contacts(organizationId), chatContactsAction, {
            enabled,
            staleTime: 60_000,
        }),
    );
}

export function useChatMessages(
    scope: string,
    target: ChatTarget,
    limit: number,
) {
    return useQuery({
        ...listQuery(
            [...chatQueries.messages(scope), limit],
            () => chatMessagesAction({ target, limit }),
            { staleTime: 5_000 },
        ),
        placeholderData: (previous, previousQuery) =>
            previousQuery?.queryKey[SCOPE_INDEX] === scope
                ? previous
                : undefined,
    });
}

export function useChatThread(scope: string, messageId: string) {
    return useQuery(
        itemQuery(
            [...chatQueries.thread(scope), messageId],
            () => chatThreadAction({ messageId }),
            { staleTime: 5_000 },
        ),
    );
}

export function useChatPinned(scope: string, target: ChatTarget) {
    return useQuery(
        listQuery(chatQueries.pinned(scope), () =>
            chatPinnedAction({ target }),
        ),
    );
}

export function useChatLinks(scope: string, target: ChatTarget) {
    return useQuery(
        listQuery(chatQueries.links(scope), () => chatLinksAction({ target })),
    );
}

export function useChatAttachments(scope: string, target: ChatTarget) {
    return useQuery(
        listQuery(chatQueries.attachments(scope), () =>
            chatAttachmentsAction({ target }),
        ),
    );
}

export function useChatMessageSearch(organizationId: string, query: string) {
    const trimmed = query.trim();

    return useQuery(
        listQuery(
            [...chatQueries.search(organizationId), trimmed],
            () => chatMessageSearchAction({ query: trimmed }),
            {
                enabled: trimmed.length >= SEARCH_QUERY_MIN,
                staleTime: 15_000,
            },
        ),
    );
}

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

            broadcastScope(scope);
            broadcastScope(chatChannelsScope(organizationId));
        },
    });
}

export const useEditChatMessage = makeScopedMutation(editChatMessageAction);

export const useDeleteChatMessage = makeScopedMutation(deleteChatMessageAction);

export const useSetChatMessagePin = makeScopedMutation(setChatMessagePinAction);

export const useStartDirectChat = makeScopedMutation(startDirectChatAction);

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
            broadcastScope(scope);
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

            broadcastScope(chatChannelsScope(organizationId));
        },
    });
}
