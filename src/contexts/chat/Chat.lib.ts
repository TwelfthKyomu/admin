import 'server-only';

import { db } from '@/infrastructure/database/client';
import { ApplicationError } from '@/shared/api/errors';
import { canSeeProject, listProjectPermissions } from '@/shared/api/permission';
import { PAGE_SIZE_HUGE } from '@/shared/constants/default';
import { publishScopeEvent } from '@/shared/realtime/scopeEvents';
import { findMemberIdByUserId } from '@/contexts/organizationMember/OrganizationMember.lib';
import { organizationMembers } from '@/contexts/organizationMember/OrganizationMembers.table';
import { listOrganizationProjects } from '@/contexts/project/Project.lib';
import { users } from '@/contexts/user/Users.table';
import { and, desc, eq, isNull, ne, or } from 'drizzle-orm';
import {
    ChatChannelType,
    type ChatContactView,
    type ChatProjectChannelView,
    type ChatTarget,
    channelTarget,
    chatChannelsScope,
    chatScopeKey,
    type DirectChannelView,
    directChannelPair,
    isChatParticipant,
} from './Chat.types';
import {
    type ChatChannelRecord,
    type ChatMessageRecord,
    chatChannels,
} from './ChatChannels.table';
import { requireChatMessage } from './ChatMessage.lib';

export const listChatProjects = async (
    userId: string,
    organizationId: string,
): Promise<ChatProjectChannelView[]> => {
    const [all, permissions] = await Promise.all([
        listOrganizationProjects(organizationId),
        listProjectPermissions(userId),
    ]);

    return all
        .filter((project) => permissions[project.id])
        .map(({ id, name, color }) => ({ id, name, color }))
        .sort((a, b) => a.name.localeCompare(b.name));
};

export const findChatChannelById = async (
    channelId: string,
): Promise<ChatChannelRecord | null> => {
    const [row] = await db
        .select()
        .from(chatChannels)
        .where(eq(chatChannels.id, channelId))
        .limit(1);

    return row ?? null;
};

export const assertChannelAccess = async (
    userId: string,
    organizationId: string,
    channel: ChatChannelRecord,
): Promise<void> => {
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
};

export const requireAccessibleMessage = async (
    userId: string,
    organizationId: string,
    messageId: string,
): Promise<{ message: ChatMessageRecord; channel: ChatChannelRecord }> => {
    const found = await requireChatMessage(messageId, organizationId);

    await assertChannelAccess(userId, organizationId, found.channel);

    return found;
};

export const findChannel = async (
    userId: string,
    organizationId: string,
    target: ChatTarget,
): Promise<ChatChannelRecord | null> => {
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
};

export const getOrCreateChannel = async (
    userId: string,
    organizationId: string,
    target: ChatTarget,
): Promise<ChatChannelRecord> => {
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
};

export const startDirectChannel = async (
    userId: string,
    organizationId: string,
    otherUserId: string,
): Promise<string> => {
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
};

export const listDirectChannels = async (
    organizationId: string,
    userId: string,
): Promise<DirectChannelView[]> => {
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
};

export const listChatContacts = (
    organizationId: string,
    userId: string,
): Promise<ChatContactView[]> => {
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
};

export const publishChannelChange = (
    organizationId: string,
    channel: Pick<ChatChannelRecord, 'id' | 'type' | 'projectId'>,
    userId: string,
): void => {
    publishScopeEvent(chatScopeKey(organizationId, channelTarget(channel)), {
        type: 'sync',
        userId,
    });

    publishChannelsChange(organizationId, userId);
};

export const publishChannelsChange = (
    organizationId: string,
    userId: string,
): void => {
    publishScopeEvent(chatChannelsScope(organizationId), {
        type: 'sync',
        userId,
    });
};
