'use server';

import {
    organizationMemberAction,
    organizationMemberMutationAction,
} from '@/shared/api/action-client';
import { PAGE_SIZE_DEFAULT } from '@/shared/constants/default';
import { isOrganizationManager } from '@/contexts/organizationMember/OrganizationMember.types';
import {
    findChannel,
    listChatContacts,
    listChatProjects,
    listDirectChannels,
    publishChannelsChange,
    requireAccessibleMessage,
    startDirectChannel,
} from './Chat.lib';
import {
    ChatMessageRefActionInputSchema,
    ChatMessageSearchActionInputSchema,
    ChatMessagesActionInputSchema,
    ChatTargetActionInputSchema,
    StartDirectChatActionInputSchema,
} from './Chat.schema';
import type { ChatChannelsView } from './Chat.types';
import { listChannelAttachments } from './ChatAttachment.lib';
import {
    countUnreadByScope,
    listLastMessages,
    listReadByOthers,
    markChannelRead,
    searchChatMessages,
} from './ChatInbox.lib';
import {
    listChannelLinks,
    listChannelMessages,
    listPinnedMessages,
    listThread,
} from './ChatMessageList.lib';

const withChannel = async <T>(
    userId: string,
    organizationId: string,
    target: Parameters<typeof findChannel>[2],
    load: (channelId: string) => Promise<T[]>,
): Promise<T[]> => {
    const channel = await findChannel(userId, organizationId, target);

    return channel ? load(channel.id) : [];
};

export const chatChannelsAction = organizationMemberAction().action(
    async ({ ctx: { userId, organizationId, role } }) => {
        const canManage = isOrganizationManager(role);

        const [projects, directs] = await Promise.all([
            listChatProjects(userId, organizationId),
            listDirectChannels(organizationId, userId),
        ]);

        const projectIds = projects.map((project) => project.id);

        const [unread, lastMessages, readByOthers] = await Promise.all([
            countUnreadByScope(organizationId, userId, projectIds),
            listLastMessages(organizationId, userId, projectIds),
            listReadByOthers(organizationId, userId, projectIds),
        ]);

        return {
            canManage,
            projects,
            directs,
            unread,
            lastMessages,
            readByOthers,
        } satisfies ChatChannelsView;
    },
);

export const chatContactsAction = organizationMemberAction().action(
    ({ ctx: { userId, organizationId } }) =>
        listChatContacts(organizationId, userId),
);

export const chatMessagesAction = organizationMemberAction()
    .inputSchema(ChatMessagesActionInputSchema)
    .action(
        ({ parsedInput: { target, limit }, ctx: { userId, organizationId } }) =>
            withChannel(userId, organizationId, target, (channelId) =>
                listChannelMessages(
                    channelId,
                    userId,
                    limit ?? PAGE_SIZE_DEFAULT,
                ),
            ),
    );

export const chatPinnedAction = organizationMemberAction()
    .inputSchema(ChatTargetActionInputSchema)
    .action(({ parsedInput: { target }, ctx: { userId, organizationId } }) =>
        withChannel(userId, organizationId, target, (channelId) =>
            listPinnedMessages(channelId, userId),
        ),
    );

export const chatLinksAction = organizationMemberAction()
    .inputSchema(ChatTargetActionInputSchema)
    .action(({ parsedInput: { target }, ctx: { userId, organizationId } }) =>
        withChannel(userId, organizationId, target, (channelId) =>
            listChannelLinks(channelId),
        ),
    );

export const chatAttachmentsAction = organizationMemberAction()
    .inputSchema(ChatTargetActionInputSchema)
    .action(({ parsedInput: { target }, ctx: { userId, organizationId } }) =>
        withChannel(userId, organizationId, target, (channelId) =>
            listChannelAttachments(channelId),
        ),
    );

export const chatMessageSearchAction = organizationMemberAction()
    .inputSchema(ChatMessageSearchActionInputSchema)
    .action(
        async ({ parsedInput: { query }, ctx: { userId, organizationId } }) => {
            const projects = await listChatProjects(userId, organizationId);

            return searchChatMessages(
                organizationId,
                userId,
                projects.map((project) => project.id),
                query,
            );
        },
    );

export const chatThreadAction = organizationMemberAction()
    .inputSchema(ChatMessageRefActionInputSchema)
    .action(async ({ parsedInput, ctx: { userId, organizationId } }) => {
        await requireAccessibleMessage(
            userId,
            organizationId,
            parsedInput.messageId,
        );

        return listThread(parsedInput.messageId, userId);
    });

export const markChatReadAction = organizationMemberMutationAction()
    .inputSchema(ChatTargetActionInputSchema)
    .action(
        async ({
            parsedInput: { target },
            ctx: { userId, organizationId },
        }) => {
            const channel = await findChannel(userId, organizationId, target);

            if (channel) await markChannelRead(channel.id, userId);

            publishChannelsChange(organizationId, userId);

            return { ok: true };
        },
    );

export const startDirectChatAction = organizationMemberMutationAction()
    .inputSchema(StartDirectChatActionInputSchema)
    .action(async ({ parsedInput, ctx: { userId, organizationId } }) => {
        const channelId = await startDirectChannel(
            userId,
            organizationId,
            parsedInput.otherUserId,
        );

        publishChannelsChange(organizationId, userId);

        return { channelId };
    });
