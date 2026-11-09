'use server';

import { db } from '@/infrastructure/database/client';
import { organizationMemberMutationAction } from '@/shared/api/action-client';
import { ApplicationError } from '@/shared/api/errors';
import { insertOne } from '@/shared/api/repository';
import { isOrganizationManager } from '@/contexts/organizationMember/OrganizationMember.types';
import { eq, or } from 'drizzle-orm';
import {
    getOrCreateChannel,
    publishChannelChange,
    requireAccessibleMessage,
} from './Chat.lib';
import {
    ChatMessageRefActionInputSchema,
    EditChatMessageActionInputSchema,
    SendChatMessageActionInputSchema,
    SetChatMessagePinActionInputSchema,
    SetChatReactionActionInputSchema,
} from './Chat.schema';
import { ChatChannelType, isChatParticipant } from './Chat.types';
import { attachToMessage, messageHasAttachments } from './ChatAttachment.lib';
import { chatMessages } from './ChatChannels.table';
import { markChannelRead } from './ChatInbox.lib';
import {
    findMessageInChannel,
    setMessagePin,
    setReaction,
} from './ChatMessage.lib';

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

        publishChannelChange(organizationId, channel, userId);

        return message;
    });

export const editChatMessageAction = organizationMemberMutationAction()
    .inputSchema(EditChatMessageActionInputSchema)
    .action(
        async ({
            parsedInput: { messageId, body },
            ctx: { userId, organizationId },
        }) => {
            const { message, channel } = await requireAccessibleMessage(
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

            publishChannelChange(organizationId, channel, userId);

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
            const { message, channel } = await requireAccessibleMessage(
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

            publishChannelChange(organizationId, channel, userId);

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

            publishChannelChange(organizationId, channel, userId);

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
            const { channel } = await requireAccessibleMessage(
                userId,
                organizationId,
                messageId,
            );

            const reactions = await setReaction(messageId, userId, emoji);

            publishChannelChange(organizationId, channel, userId);

            return reactions;
        },
    );
