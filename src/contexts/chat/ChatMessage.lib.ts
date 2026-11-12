import 'server-only';

import { db } from '@/infrastructure/database/client';
import { ApplicationError } from '@/shared/api/errors';
import { and, eq, isNull } from 'drizzle-orm';
import {
    type ChatChannelRecord,
    type ChatMessageRecord,
    chatChannels,
    chatMessageReactions,
    chatMessages,
} from './ChatChannels.table';

export const requireChatMessage = async (
    messageId: string,
    organizationId: string,
): Promise<{ message: ChatMessageRecord; channel: ChatChannelRecord }> => {
    const [row] = await db
        .select({ message: chatMessages, channel: chatChannels })
        .from(chatMessages)
        .innerJoin(chatChannels, eq(chatChannels.id, chatMessages.channelId))
        .where(
            and(
                eq(chatMessages.id, messageId),
                eq(chatChannels.organizationId, organizationId),
                isNull(chatMessages.deletedAt),
            ),
        )
        .limit(1);

    if (!row) throw new ApplicationError('Сообщение не найдено');

    return row;
};

export const findMessageInChannel = async (
    channelId: string,
    messageId: string,
): Promise<{ threadRootId: string | null } | null> => {
    const [row] = await db
        .select({ threadRootId: chatMessages.threadRootId })
        .from(chatMessages)
        .where(
            and(
                eq(chatMessages.id, messageId),
                eq(chatMessages.channelId, channelId),
                isNull(chatMessages.deletedAt),
            ),
        )
        .limit(1);

    return row ?? null;
};

export const setMessagePin = async (
    messageId: string,
    pinned: boolean,
): Promise<void> => {
    await db
        .update(chatMessages)
        .set({ pinnedAt: pinned ? new Date() : null })
        .where(eq(chatMessages.id, messageId));
};

export const setReaction = async (
    messageId: string,
    userId: string,
    emoji: string,
): Promise<{ emoji: string | null }> => {
    const own = and(
        eq(chatMessageReactions.messageId, messageId),
        eq(chatMessageReactions.userId, userId),
    );

    const [current] = await db
        .select({ emoji: chatMessageReactions.emoji })
        .from(chatMessageReactions)
        .where(own)
        .limit(1);

    if (current?.emoji === emoji) {
        await db.delete(chatMessageReactions).where(own);

        return { emoji: null };
    }

    await db
        .insert(chatMessageReactions)
        .values({ messageId, userId, emoji })
        .onConflictDoUpdate({
            target: [
                chatMessageReactions.messageId,
                chatMessageReactions.userId,
            ],
            set: { emoji, createdAt: new Date() },
        });

    return { emoji };
};
