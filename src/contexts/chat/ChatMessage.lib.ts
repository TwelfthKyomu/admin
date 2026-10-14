import 'server-only';

import { db } from '@/infrastructure/database/client';
import { ApplicationError } from '@/shared/api/errors';
import { PAGE_SIZE_HUGE, PAGE_SIZE_SMALL } from '@/shared/constants/default';
import { projects } from '@/contexts/project/Projects.table';
import { tasks } from '@/contexts/task/Tasks.table';
import { users } from '@/contexts/user/Users.table';
import {
    and,
    count,
    desc,
    eq,
    ilike,
    inArray,
    isNotNull,
    isNull,
    type SQL,
} from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import {
    type ChatLinkView,
    type ChatMessageReactionView,
    type ChatMessageView,
    type ChatThreadView,
    extractUrls,
    sortReactions,
} from './Chat.types';
import { loadAttachments } from './ChatAttachment.lib';
import {
    type ChatChannelRecord,
    type ChatMessageRecord,
    chatChannels,
    chatMessageReactions,
    chatMessages,
} from './ChatChannels.table';

async function loadReactions(
    messageIds: string[],
    userId: string,
): Promise<Map<string, ChatMessageReactionView[]>> {
    if (messageIds.length === 0) return new Map();

    const rows = await db
        .select({
            messageId: chatMessageReactions.messageId,
            userId: chatMessageReactions.userId,
            emoji: chatMessageReactions.emoji,
        })
        .from(chatMessageReactions)
        .where(inArray(chatMessageReactions.messageId, messageIds));

    const byMessage = new Map<string, ChatMessageReactionView[]>();

    for (const row of rows) {
        const reactions = byMessage.get(row.messageId) ?? [];

        const current = reactions.find(
            (reaction) => reaction.emoji === row.emoji,
        );

        const reacted = row.userId === userId;

        if (current) {
            current.count += 1;
            current.reacted ||= reacted;
        } else {
            reactions.push({ emoji: row.emoji, count: 1, reacted });
        }

        byMessage.set(row.messageId, reactions);
    }

    for (const reactions of byMessage.values()) sortReactions(reactions);

    return byMessage;
}

async function loadMessages(
    where: SQL | undefined,
    userId: string,
    limit: number,
): Promise<ChatMessageView[]> {
    const repliedMessages = alias(chatMessages, 'replied_messages');
    const repliedAuthors = alias(users, 'replied_authors');

    const rows = await db
        .select({
            id: chatMessages.id,
            channelId: chatMessages.channelId,
            authorUserId: chatMessages.authorUserId,
            authorName: users.name,
            authorImage: users.image,
            body: chatMessages.body,
            createdAt: chatMessages.createdAt,
            editedAt: chatMessages.editedAt,
            pinnedAt: chatMessages.pinnedAt,
            replyToId: repliedMessages.id,
            replyToBody: repliedMessages.body,
            replyToDeletedAt: repliedMessages.deletedAt,
            replyToAuthorName: repliedAuthors.name,
            taskId: tasks.id,
            taskProjectId: tasks.projectId,
            taskNumber: tasks.number,
            taskProjectKey: projects.key,
        })
        .from(chatMessages)
        .leftJoin(users, eq(users.id, chatMessages.authorUserId))
        .leftJoin(
            repliedMessages,
            eq(repliedMessages.id, chatMessages.replyToId),
        )
        .leftJoin(
            repliedAuthors,
            eq(repliedAuthors.id, repliedMessages.authorUserId),
        )
        .leftJoin(tasks, eq(tasks.chatMessageId, chatMessages.id))
        .leftJoin(projects, eq(projects.id, tasks.projectId))
        .where(where)
        .orderBy(desc(chatMessages.createdAt))
        .limit(limit);

    rows.reverse();

    const messageIds = rows.map((row) => row.id);

    const [reactions, attachments, threadRows] = await Promise.all([
        loadReactions(messageIds, userId),
        loadAttachments(messageIds),
        db
            .select({ rootId: chatMessages.threadRootId, total: count() })
            .from(chatMessages)
            .where(
                and(
                    inArray(chatMessages.threadRootId, messageIds),
                    isNull(chatMessages.deletedAt),
                ),
            )
            .groupBy(chatMessages.threadRootId),
    ]);

    const threadReplies = new Map(
        threadRows.map((row) => [row.rootId, row.total]),
    );

    return rows.map((row) => ({
        id: row.id,
        channelId: row.channelId,
        authorUserId: row.authorUserId,
        authorName: row.authorName,
        authorImage: row.authorImage,
        body: row.body,
        createdAt: row.createdAt,
        editedAt: row.editedAt,
        pinnedAt: row.pinnedAt,
        replyTo: row.replyToId
            ? {
                  id: row.replyToId,
                  authorName: row.replyToAuthorName,
                  body: row.replyToDeletedAt ? null : row.replyToBody,
              }
            : null,
        reactions: reactions.get(row.id) ?? [],
        attachments: attachments.get(row.id) ?? [],
        threadReplies: threadReplies.get(row.id) ?? 0,
        task:
            row.taskId && row.taskProjectId && row.taskNumber !== null
                ? {
                      id: row.taskId,
                      projectId: row.taskProjectId,
                      number: row.taskNumber,
                      projectKey: row.taskProjectKey ?? '',
                  }
                : null,
    }));
}

export function listChannelMessages(
    channelId: string,
    userId: string,
    limit: number,
): Promise<ChatMessageView[]> {
    return loadMessages(
        and(
            eq(chatMessages.channelId, channelId),
            isNull(chatMessages.deletedAt),
            isNull(chatMessages.threadRootId),
        ),
        userId,
        limit,
    );
}

export function listPinnedMessages(
    channelId: string,
    userId: string,
): Promise<ChatMessageView[]> {
    return loadMessages(
        and(
            eq(chatMessages.channelId, channelId),
            isNull(chatMessages.deletedAt),
            isNull(chatMessages.threadRootId),
            isNotNull(chatMessages.pinnedAt),
        ),
        userId,
        PAGE_SIZE_SMALL,
    );
}

export async function listThread(
    rootMessageId: string,
    userId: string,
): Promise<ChatThreadView | null> {
    const [[root], replies] = await Promise.all([
        loadMessages(
            and(
                eq(chatMessages.id, rootMessageId),
                isNull(chatMessages.deletedAt),
            ),
            userId,
            1,
        ),
        loadMessages(
            and(
                eq(chatMessages.threadRootId, rootMessageId),
                isNull(chatMessages.deletedAt),
            ),
            userId,
            PAGE_SIZE_HUGE,
        ),
    ]);

    if (!root) return null;

    return { root, replies };
}

export async function listChannelLinks(
    channelId: string,
): Promise<ChatLinkView[]> {
    const rows = await db
        .select({
            messageId: chatMessages.id,
            body: chatMessages.body,
            authorName: users.name,
            createdAt: chatMessages.createdAt,
        })
        .from(chatMessages)
        .leftJoin(users, eq(users.id, chatMessages.authorUserId))
        .where(
            and(
                eq(chatMessages.channelId, channelId),
                isNull(chatMessages.deletedAt),
                ilike(chatMessages.body, '%http%'),
            ),
        )
        .orderBy(desc(chatMessages.createdAt))
        .limit(PAGE_SIZE_HUGE);

    return rows.flatMap((row) =>
        extractUrls(row.body).map((url) => ({
            messageId: row.messageId,
            url,
            authorName: row.authorName,
            createdAt: row.createdAt,
        })),
    );
}

export async function requireChatMessage(
    messageId: string,
    organizationId: string,
): Promise<{ message: ChatMessageRecord; channel: ChatChannelRecord }> {
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
}

export async function findMessageInChannel(
    channelId: string,
    messageId: string,
): Promise<{ threadRootId: string | null } | null> {
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
}

export async function setMessagePin(
    messageId: string,
    pinned: boolean,
): Promise<void> {
    await db
        .update(chatMessages)
        .set({ pinnedAt: pinned ? new Date() : null })
        .where(eq(chatMessages.id, messageId));
}

export async function setReaction(
    messageId: string,
    userId: string,
    emoji: string,
): Promise<{ emoji: string | null }> {
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
}
