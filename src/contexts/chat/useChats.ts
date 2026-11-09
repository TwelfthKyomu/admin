'use client';

import { SEARCH_QUERY_MIN } from '@/shared/constants/default';
import { makeScopedMutation } from '@/shared/lib/mutations';
import { itemQuery, listQuery } from '@/shared/lib/queries';
import { useQuery } from '@tanstack/react-query';
import {
    chatAttachmentsAction,
    chatChannelsAction,
    chatContactsAction,
    chatLinksAction,
    chatMessageSearchAction,
    chatMessagesAction,
    chatPinnedAction,
    chatThreadAction,
    startDirectChatAction,
} from './Chat.actions';
import { type ChatTarget, chatChannelsScope } from './Chat.types';
import {
    deleteChatMessageAction,
    editChatMessageAction,
    setChatMessagePinAction,
} from './ChatMessage.actions';

export const chatQueries = {
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

export const useEditChatMessage = makeScopedMutation(editChatMessageAction);

export const useDeleteChatMessage = makeScopedMutation(deleteChatMessageAction);

export const useSetChatMessagePin = makeScopedMutation(setChatMessagePinAction);

export const useStartDirectChat = makeScopedMutation(startDirectChatAction);
