import 'server-only';

import { db } from '@/infrastructure/database/client';
import { PAGE_SIZE_DEFAULT } from '@/shared/constants/default';
import { users } from '@/contexts/user/Users.table';
import {
    and,
    count,
    desc,
    eq,
    gt,
    ilike,
    inArray,
    isNull,
    max,
    ne,
    or,
    type SQL,
} from 'drizzle-orm';
import {
    ChatChannelType,
    type ChatLastMessageView,
    type ChatSearchResultView,
    channelTarget,
    chatScopeKey,
} from './Chat.types';
import {
    type ChatChannelRecord,
    chatChannels,
    chatMessages,
    chatReads,
} from './ChatChannels.table';

const visibleChannels = (
    organizationId: string,
    userId: string,
    visibleProjectIds: string[],
): SQL | undefined => {
    return and(
        eq(chatChannels.organizationId, organizationId),
        or(
            eq(chatChannels.type, ChatChannelType.ORGANIZATION),
            and(
                eq(chatChannels.type, ChatChannelType.DIRECT),
                or(
                    eq(chatChannels.userAId, userId),
                    eq(chatChannels.userBId, userId),
                ),
            ),
            visibleProjectIds.length > 0
                ? and(
                      eq(chatChannels.type, ChatChannelType.PROJECT),
                      inArray(chatChannels.projectId, visibleProjectIds),
                  )
                : undefined,
        ),
    );
};

const channelColumns = {
    channelId: chatChannels.id,
    type: chatChannels.type,
    projectId: chatChannels.projectId,
};

interface ChannelColumns {
    channelId: string;
    type: ChatChannelRecord['type'];
    projectId: string | null;
}

const scopeOf = (organizationId: string, row: ChannelColumns): string => {
    return chatScopeKey(
        organizationId,
        channelTarget({
            id: row.channelId,
            type: row.type,
            projectId: row.projectId,
        }),
    );
};

export const countUnreadByScope = async (
    organizationId: string,
    userId: string,
    visibleProjectIds: string[],
): Promise<Record<string, number>> => {
    const rows = await db
        .select({ ...channelColumns, unread: count(chatMessages.id) })
        .from(chatChannels)
        .leftJoin(
            chatReads,
            and(
                eq(chatReads.channelId, chatChannels.id),
                eq(chatReads.userId, userId),
            ),
        )
        .leftJoin(
            chatMessages,
            and(
                eq(chatMessages.channelId, chatChannels.id),
                isNull(chatMessages.deletedAt),
                or(
                    isNull(chatMessages.authorUserId),
                    ne(chatMessages.authorUserId, userId),
                ),
                or(
                    isNull(chatReads.lastReadAt),
                    gt(chatMessages.createdAt, chatReads.lastReadAt),
                ),
            ),
        )
        .where(visibleChannels(organizationId, userId, visibleProjectIds))
        .groupBy(chatChannels.id, chatChannels.type, chatChannels.projectId);

    const unread: Record<string, number> = {};

    for (const row of rows) {
        if (row.unread > 0) unread[scopeOf(organizationId, row)] = row.unread;
    }

    return unread;
};

export const listLastMessages = async (
    organizationId: string,
    userId: string,
    visibleProjectIds: string[],
): Promise<Record<string, ChatLastMessageView>> => {
    const rows = await db
        .selectDistinctOn([chatMessages.channelId], {
            ...channelColumns,
            body: chatMessages.body,
            authorUserId: chatMessages.authorUserId,
            authorName: users.name,
            createdAt: chatMessages.createdAt,
        })
        .from(chatMessages)
        .innerJoin(chatChannels, eq(chatChannels.id, chatMessages.channelId))
        .leftJoin(users, eq(users.id, chatMessages.authorUserId))
        .where(
            and(
                visibleChannels(organizationId, userId, visibleProjectIds),
                isNull(chatMessages.deletedAt),
                isNull(chatMessages.threadRootId),
            ),
        )
        .orderBy(chatMessages.channelId, desc(chatMessages.createdAt));

    const lastMessages: Record<string, ChatLastMessageView> = {};

    for (const row of rows) {
        lastMessages[scopeOf(organizationId, row)] = {
            body: row.body,
            authorUserId: row.authorUserId,
            authorName: row.authorName,
            createdAt: row.createdAt,
        };
    }

    return lastMessages;
};

export const listReadByOthers = async (
    organizationId: string,
    userId: string,
    visibleProjectIds: string[],
): Promise<Record<string, Date>> => {
    const rows = await db
        .select({ ...channelColumns, readAt: max(chatReads.lastReadAt) })
        .from(chatChannels)
        .innerJoin(
            chatReads,
            and(
                eq(chatReads.channelId, chatChannels.id),
                ne(chatReads.userId, userId),
            ),
        )
        .where(visibleChannels(organizationId, userId, visibleProjectIds))
        .groupBy(chatChannels.id, chatChannels.type, chatChannels.projectId);

    const readByOthers: Record<string, Date> = {};

    for (const row of rows) {
        if (row.readAt) readByOthers[scopeOf(organizationId, row)] = row.readAt;
    }

    return readByOthers;
};

export const searchChatMessages = async (
    organizationId: string,
    userId: string,
    visibleProjectIds: string[],
    query: string,
): Promise<ChatSearchResultView[]> => {
    const pattern = `%${query.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;

    const rows = await db
        .select({
            ...channelColumns,
            id: chatMessages.id,
            authorName: users.name,
            body: chatMessages.body,
            createdAt: chatMessages.createdAt,
            threadRootId: chatMessages.threadRootId,
        })
        .from(chatMessages)
        .innerJoin(chatChannels, eq(chatChannels.id, chatMessages.channelId))
        .leftJoin(users, eq(users.id, chatMessages.authorUserId))
        .where(
            and(
                visibleChannels(organizationId, userId, visibleProjectIds),
                isNull(chatMessages.deletedAt),
                ilike(chatMessages.body, pattern),
            ),
        )
        .orderBy(desc(chatMessages.createdAt))
        .limit(PAGE_SIZE_DEFAULT);

    return rows.map((row) => ({
        id: row.id,
        authorName: row.authorName,
        body: row.body,
        createdAt: row.createdAt,
        threadRootId: row.threadRootId,
        target: channelTarget({
            id: row.channelId,
            type: row.type,
            projectId: row.projectId,
        }),
    }));
};

export const markChannelRead = async (
    channelId: string,
    userId: string,
): Promise<void> => {
    await db
        .insert(chatReads)
        .values({ channelId, userId, lastReadAt: new Date() })
        .onConflictDoUpdate({
            target: [chatReads.channelId, chatReads.userId],
            set: { lastReadAt: new Date() },
        });
};
