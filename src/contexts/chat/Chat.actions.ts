'use server';

import { db } from '@/infrastructure/database/client';
import {
    organizationMemberAction,
    organizationMemberMutationAction,
} from '@/shared/api/action-client';
import { ApplicationError } from '@/shared/api/errors';
import { insertOne } from '@/shared/api/repository';
import { PAGE_SIZE_DEFAULT } from '@/shared/constants/default';
import { isOrganizationManager } from '@/contexts/organizationMember/OrganizationMember.types';
import { eq, or } from 'drizzle-orm';
import {
    countUnreadByScope,
    findChannel,
    getOrCreateChannel,
    listChatContacts,
    listChatProjects,
    listDirectChannels,
    listLastMessages,
    listReadByOthers,
    markChannelRead,
    requireAccessibleMessage,
    searchChatMessages,
    startDirectChannel,
} from './Chat.lib';
import {
    ChatMessageRefActionInputSchema,
    ChatMessageSearchActionInputSchema,
    ChatMessagesActionInputSchema,
    ChatTargetActionInputSchema,
    EditChatMessageActionInputSchema,
    SendChatMessageActionInputSchema,
    SetChatMessagePinActionInputSchema,
    SetChatReactionActionInputSchema,
    StartDirectChatActionInputSchema,
} from './Chat.schema';
import {
    type ChatChannelsView,
    ChatChannelType,
    isChatParticipant,
} from './Chat.types';
import {
    attachToMessage,
    listChannelAttachments,
    messageHasAttachments,
} from './ChatAttachment.lib';
import { chatMessages } from './ChatChannels.table';
import {
    findMessageInChannel,
    listChannelLinks,
    listChannelMessages,
    listPinnedMessages,
    listThread,
    setMessagePin,
    setReaction,
} from './ChatMessage.lib';

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
        async ({
            parsedInput: { target, limit },
            ctx: { userId, organizationId },
        }) => {
            const channel = await findChannel(userId, organizationId, target);

            if (!channel) return [];

            return listChannelMessages(
                channel.id,
                userId,
                limit ?? PAGE_SIZE_DEFAULT,
            );
        },
    );

export const chatPinnedAction = organizationMemberAction()
    .inputSchema(ChatTargetActionInputSchema)
    .action(
        async ({
            parsedInput: { target },
            ctx: { userId, organizationId },
        }) => {
            const channel = await findChannel(userId, organizationId, target);

            if (!channel) return [];

            return listPinnedMessages(channel.id, userId);
        },
    );

export const chatLinksAction = organizationMemberAction()
    .inputSchema(ChatTargetActionInputSchema)
    .action(
        async ({
            parsedInput: { target },
            ctx: { userId, organizationId },
        }) => {
            const channel = await findChannel(userId, organizationId, target);

            if (!channel) return [];

            return listChannelLinks(channel.id);
        },
    );

export const chatAttachmentsAction = organizationMemberAction()
    .inputSchema(ChatTargetActionInputSchema)
    .action(
        async ({
            parsedInput: { target },
            ctx: { userId, organizationId },
        }) => {
            const channel = await findChannel(userId, organizationId, target);

            if (!channel) return [];

            return listChannelAttachments(channel.id);
        },
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

export const sendChatMessageAction = organizationMemberMutationAction()
    .inputSchema(SendChatMessageActionInputSchema)
    .action(async ({ parsedInput, ctx: { userId, organizationId } }) => {
        const body = parsedInput.body.trim();
        const attachmentIds = parsedInput.attachmentIds ?? [];

        if (!body && attachmentIds.length === 0) {
            throw new ApplicationError('Напишите сообщение или приложите файл');
        }

        const channel = await getOrCreateChannel(
            userId,
            organizationId,
            parsedInput.target,
        );

        const threadRootId = parsedInput.threadRootId ?? null;

        const [root, replyTo] = await Promise.all([
            threadRootId
                ? findMessageInChannel(channel.id, threadRootId)
                : null,
            parsedInput.replyToId
                ? findMessageInChannel(channel.id, parsedInput.replyToId)
                : null,
        ]);

        if (threadRootId) {
            if (!root) throw new ApplicationError('Обсуждение недоступно');
            if (root.threadRootId) {
                throw new ApplicationError(
                    'Нельзя открыть обсуждение внутри обсуждения',
                );
            }
        }

        if (parsedInput.replyToId) {
            if (!replyTo) {
                throw new ApplicationError(
                    'Сообщение, на которое вы отвечаете, недоступно',
                );
            }
            if (replyTo.threadRootId !== threadRootId) {
                throw new ApplicationError(
                    'Ответ и исходное сообщение из разных обсуждений',
                );
            }
        }

        const message = await db.transaction(async (tx) => {
            const inserted = await insertOne(
                chatMessages,
                {
                    channelId: channel.id,
                    authorUserId: userId,
                    replyToId: parsedInput.replyToId ?? null,
                    threadRootId,
                    body,
                },
                'Не удалось отправить сообщение',
                tx,
            );

            await attachToMessage(tx, {
                messageId: inserted.id,
                channelId: channel.id,
                userId,
                attachmentIds,
            });

            return inserted;
        });

        await markChannelRead(channel.id, userId);

        return message;
    });

export const editChatMessageAction = organizationMemberMutationAction()
    .inputSchema(EditChatMessageActionInputSchema)
    .action(
        async ({
            parsedInput: { messageId, body },
            ctx: { userId, organizationId },
        }) => {
            const { message } = await requireAccessibleMessage(
                userId,
                organizationId,
                messageId,
            );

            if (message.authorUserId !== userId) {
                throw new ApplicationError(
                    'Редактировать можно только свои сообщения',
                );
            }

            const nextBody = body.trim();

            if (!nextBody && !(await messageHasAttachments(messageId))) {
                throw new ApplicationError('Сообщение не может быть пустым');
            }

            await db
                .update(chatMessages)
                .set({ body: nextBody, editedAt: new Date() })
                .where(eq(chatMessages.id, messageId));

            return { ok: true };
        },
    );

export const deleteChatMessageAction = organizationMemberMutationAction()
    .inputSchema(ChatMessageRefActionInputSchema)
    .action(
        async ({
            parsedInput: { messageId },
            ctx: { userId, organizationId, role },
        }) => {
            const { message } = await requireAccessibleMessage(
                userId,
                organizationId,
                messageId,
            );

            if (
                message.authorUserId !== userId &&
                !isOrganizationManager(role)
            ) {
                throw new ApplicationError(
                    'Можно удалять только свои сообщения',
                );
            }

            await db
                .update(chatMessages)
                .set({ deletedAt: new Date() })
                .where(
                    or(
                        eq(chatMessages.id, message.id),
                        eq(chatMessages.threadRootId, message.id),
                    ),
                );

            return { ok: true };
        },
    );

export const setChatMessagePinAction = organizationMemberMutationAction()
    .inputSchema(SetChatMessagePinActionInputSchema)
    .action(
        async ({
            parsedInput: { messageId, pinned },
            ctx: { userId, organizationId, role },
        }) => {
            const { message, channel } = await requireAccessibleMessage(
                userId,
                organizationId,
                messageId,
            );

            const canPin =
                channel.type === ChatChannelType.DIRECT
                    ? isChatParticipant(channel, userId)
                    : isOrganizationManager(role);

            if (!canPin) {
                throw new ApplicationError(
                    'Закреплять сообщения может владелец или администратор',
                );
            }

            if (message.threadRootId) {
                throw new ApplicationError(
                    'Закреплять можно только сообщения ленты канала',
                );
            }

            await setMessagePin(messageId, pinned);

            return { pinned };
        },
    );

export const setChatReactionAction = organizationMemberMutationAction()
    .inputSchema(SetChatReactionActionInputSchema)
    .action(
        async ({
            parsedInput: { messageId, emoji },
            ctx: { userId, organizationId },
        }) => {
            await requireAccessibleMessage(userId, organizationId, messageId);

            return setReaction(messageId, userId, emoji);
        },
    );

export const markChatReadAction = organizationMemberMutationAction()
    .inputSchema(ChatTargetActionInputSchema)
    .action(
        async ({
            parsedInput: { target },
            ctx: { userId, organizationId },
        }) => {
            const channel = await findChannel(userId, organizationId, target);

            if (channel) await markChannelRead(channel.id, userId);

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

        return { channelId };
    });
