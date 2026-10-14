import 'server-only';

import { db } from '@/infrastructure/database/client';
import { ApplicationError } from '@/shared/api/errors';
import { canSeeProject, listProjectPermissions } from '@/shared/api/permission';
import { PAGE_SIZE_DEFAULT, PAGE_SIZE_HUGE } from '@/shared/constants/default';
import { findMemberIdByUserId } from '@/contexts/organizationMember/OrganizationMember.lib';
import { organizationMembers } from '@/contexts/organizationMember/OrganizationMembers.table';
import { listOrganizationProjects } from '@/contexts/project/Project.lib';
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
    type ChatContactView,
    type ChatLastMessageView,
    type ChatProjectChannelView,
    type ChatSearchResultView,
    type ChatTarget,
    channelTarget,
    chatScopeKey,
    type DirectChannelView,
    directChannelPair,
    isChatParticipant,
} from './Chat.types';
import {
    type ChatChannelRecord,
    type ChatMessageRecord,
    chatChannels,
    chatMessages,
    chatReads,
} from './ChatChannels.table';
import { requireChatMessage } from './ChatMessage.lib';

export async function listChatProjects(
    userId: string,
    organizationId: string,
): Promise<ChatProjectChannelView[]> {
    const [all, permissions] = await Promise.all([
        listOrganizationProjects(organizationId),
        listProjectPermissions(userId),
    ]);

    return all
        .filter((project) => permissions[project.id])
        .map(({ id, name, color }) => ({ id, name, color }))
        .sort((a, b) => a.name.localeCompare(b.name));
}

export async function findChatChannelById(
    channelId: string,
): Promise<ChatChannelRecord | null> {
    const [row] = await db
        .select()
        .from(chatChannels)
        .where(eq(chatChannels.id, channelId))
        .limit(1);

    return row ?? null;
}

export async function assertChannelAccess(
    userId: string,
    organizationId: string,
    channel: ChatChannelRecord,
): Promise<void> {
    if (channel.organizationId !== organizationId) {
        throw new ApplicationError('Канал недоступен');
    }

    if (channel.type === ChatChannelType.DIRECT) {
        if (!isChatParticipant(channel, userId)) {
            throw new ApplicationError('Личный чат недоступен');
        }

        return;
    }

    if (channel.type === ChatChannelType.PROJECT) {
        const allowed =
            channel.projectId !== null &&
            (await canSeeProject(userId, channel.projectId));

        if (!allowed) {
            throw new ApplicationError('Вы не привязаны к этому проекту');
        }
    }
}

export async function requireAccessibleMessage(
    userId: string,
    organizationId: string,
    messageId: string,
): Promise<{ message: ChatMessageRecord; channel: ChatChannelRecord }> {
    const found = await requireChatMessage(messageId, organizationId);

    await assertChannelAccess(userId, organizationId, found.channel);

    return found;
}

export async function findChannel(
    userId: string,
    organizationId: string,
    target: ChatTarget,
): Promise<ChatChannelRecord | null> {
    if (target.kind === 'direct') {
        const channel = await findChatChannelById(target.channelId);

        if (!channel || channel.type !== ChatChannelType.DIRECT) {
            throw new ApplicationError('Личный чат недоступен');
        }

        await assertChannelAccess(userId, organizationId, channel);

        return channel;
    }

    if (target.kind === 'project') {
        const allowed = await canSeeProject(userId, target.projectId);

        if (!allowed) {
            throw new ApplicationError('Вы не привязаны к этому проекту');
        }
    }

    const [channel] = await db
        .select()
        .from(chatChannels)
        .where(
            and(
                eq(chatChannels.organizationId, organizationId),
                target.kind === 'project'
                    ? and(
                          eq(chatChannels.type, ChatChannelType.PROJECT),
                          eq(chatChannels.projectId, target.projectId),
                      )
                    : eq(chatChannels.type, ChatChannelType.ORGANIZATION),
            ),
        )
        .limit(1);

    return channel ?? null;
}

export async function getOrCreateChannel(
    userId: string,
    organizationId: string,
    target: ChatTarget,
): Promise<ChatChannelRecord> {
    const existing = await findChannel(userId, organizationId, target);

    if (existing) return existing;

    const [created] = await db
        .insert(chatChannels)
        .values({
            organizationId,
            type:
                target.kind === 'project'
                    ? ChatChannelType.PROJECT
                    : ChatChannelType.ORGANIZATION,
            projectId: target.kind === 'project' ? target.projectId : null,
        })
        .onConflictDoNothing()
        .returning();

    if (created) return created;

    const channel = await findChannel(userId, organizationId, target);

    if (!channel) throw new ApplicationError('Не удалось создать канал чата');

    return channel;
}

export async function startDirectChannel(
    userId: string,
    organizationId: string,
    otherUserId: string,
): Promise<string> {
    if (otherUserId === userId) {
        throw new ApplicationError('Нельзя открыть личный чат с самим собой');
    }
    if (!(await findMemberIdByUserId(organizationId, otherUserId))) {
        throw new ApplicationError(
            'Пользователь не состоит в вашей организации',
        );
    }

    const [userAId, userBId] = directChannelPair(userId, otherUserId);

    const [created] = await db
        .insert(chatChannels)
        .values({
            organizationId,
            type: ChatChannelType.DIRECT,
            userAId,
            userBId,
        })
        .onConflictDoNothing()
        .returning({ id: chatChannels.id });

    if (created) return created.id;

    const [existing] = await db
        .select({ id: chatChannels.id })
        .from(chatChannels)
        .where(
            and(
                eq(chatChannels.organizationId, organizationId),
                eq(chatChannels.type, ChatChannelType.DIRECT),
                eq(chatChannels.userAId, userAId),
                eq(chatChannels.userBId, userBId),
            ),
        )
        .limit(1);

    if (!existing) throw new ApplicationError('Не удалось создать личный чат');

    return existing.id;
}

export async function listDirectChannels(
    organizationId: string,
    userId: string,
): Promise<DirectChannelView[]> {
    const rows = await db
        .select({
            id: chatChannels.id,
            otherUserId: users.id,
            otherUserName: users.name,
            otherUserImage: users.image,
            createdAt: chatChannels.createdAt,
        })
        .from(chatChannels)
        .innerJoin(
            users,
            and(
                or(
                    eq(users.id, chatChannels.userAId),
                    eq(users.id, chatChannels.userBId),
                ),
                ne(users.id, userId),
            ),
        )
        .where(
            and(
                eq(chatChannels.organizationId, organizationId),
                eq(chatChannels.type, ChatChannelType.DIRECT),
                or(
                    eq(chatChannels.userAId, userId),
                    eq(chatChannels.userBId, userId),
                ),
            ),
        )
        .orderBy(desc(chatChannels.createdAt));

    return rows.map((row) => ({
        id: row.id,
        otherUser: {
            id: row.otherUserId,
            name: row.otherUserName,
            image: row.otherUserImage,
        },
        createdAt: row.createdAt,
    }));
}

export function listChatContacts(
    organizationId: string,
    userId: string,
): Promise<ChatContactView[]> {
    return db
        .select({
            id: users.id,
            name: users.name,
            email: users.email,
            image: users.image,
            role: organizationMembers.role,
        })
        .from(organizationMembers)
        .innerJoin(users, eq(users.id, organizationMembers.userId))
        .where(
            and(
                eq(organizationMembers.organizationId, organizationId),
                isNull(organizationMembers.leftAt),
                ne(organizationMembers.userId, userId),
            ),
        )
        .orderBy(desc(organizationMembers.joinedAt))
        .limit(PAGE_SIZE_HUGE);
}

function visibleChannels(
    organizationId: string,
    userId: string,
    visibleProjectIds: string[],
): SQL | undefined {
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
}

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

function scopeOf(organizationId: string, row: ChannelColumns): string {
    return chatScopeKey(
        organizationId,
        channelTarget({
            id: row.channelId,
            type: row.type,
            projectId: row.projectId,
        }),
    );
}

export async function countUnreadByScope(
    organizationId: string,
    userId: string,
    visibleProjectIds: string[],
): Promise<Record<string, number>> {
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
}

export async function listLastMessages(
    organizationId: string,
    userId: string,
    visibleProjectIds: string[],
): Promise<Record<string, ChatLastMessageView>> {
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
}

export async function listReadByOthers(
    organizationId: string,
    userId: string,
    visibleProjectIds: string[],
): Promise<Record<string, Date>> {
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
}

export async function searchChatMessages(
    organizationId: string,
    userId: string,
    visibleProjectIds: string[],
    query: string,
): Promise<ChatSearchResultView[]> {
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
}

export async function markChannelRead(
    channelId: string,
    userId: string,
): Promise<void> {
    await db
        .insert(chatReads)
        .values({ channelId, userId, lastReadAt: new Date() })
        .onConflictDoUpdate({
            target: [chatReads.channelId, chatReads.userId],
            set: { lastReadAt: new Date() },
        });
}
