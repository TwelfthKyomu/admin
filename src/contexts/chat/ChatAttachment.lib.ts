import 'server-only';

import { db, type Tx } from '@/infrastructure/database/client';
import { chatFileResponse } from '@/infrastructure/storage/uploads';
import { chatUploadUrl } from '@/infrastructure/storage/uploadUrls';
import { ApplicationError } from '@/shared/api/errors';
import { requireUserOrganization } from '@/shared/api/permission';
import { insertOne } from '@/shared/api/repository';
import { forbiddenResponse, notFoundResponse } from '@/shared/api/response';
import { PAGE_SIZE_HUGE } from '@/shared/constants/default';
import { users } from '@/contexts/user/Users.table';
import { and, desc, eq, inArray, isNull } from 'drizzle-orm';
import * as z from 'zod/mini';
import { assertChannelAccess } from './Chat.lib';
import { ChatTargetSchema } from './Chat.schema';
import type { ChannelAttachmentView, ChatAttachmentView } from './Chat.types';
import {
    type ChatAttachmentRecord,
    type ChatChannelRecord,
    chatAttachments,
    chatChannels,
    chatMessages,
} from './ChatChannels.table';

type AttachmentRow = Pick<
    ChatAttachmentRecord,
    'id' | 'channelId' | 'filename' | 'name' | 'contentType' | 'sizeBytes'
>;

const toAttachmentView = (row: AttachmentRow): ChatAttachmentView => {
    return {
        id: row.id,
        name: row.name,
        contentType: row.contentType,
        sizeBytes: row.sizeBytes,
        url: chatUploadUrl(row.channelId, row.filename),
    };
};

const attachmentColumns = {
    id: chatAttachments.id,
    channelId: chatAttachments.channelId,
    filename: chatAttachments.filename,
    name: chatAttachments.name,
    contentType: chatAttachments.contentType,
    sizeBytes: chatAttachments.sizeBytes,
};

export const loadAttachments = async (
    messageIds: string[],
): Promise<Map<string, ChatAttachmentView[]>> => {
    if (messageIds.length === 0) return new Map();

    const rows = await db
        .select({ ...attachmentColumns, messageId: chatAttachments.messageId })
        .from(chatAttachments)
        .where(inArray(chatAttachments.messageId, messageIds))
        .orderBy(chatAttachments.createdAt);

    const byMessage = Map.groupBy(rows, (row) => row.messageId ?? '');

    return new Map(
        [...byMessage].map(([messageId, list]) => [
            messageId,
            list.map(toAttachmentView),
        ]),
    );
};

export const listChannelAttachments = async (
    channelId: string,
): Promise<ChannelAttachmentView[]> => {
    const rows = await db
        .select({
            ...attachmentColumns,
            messageId: chatMessages.id,
            authorName: users.name,
            createdAt: chatAttachments.createdAt,
        })
        .from(chatAttachments)
        .innerJoin(chatMessages, eq(chatMessages.id, chatAttachments.messageId))
        .leftJoin(users, eq(users.id, chatMessages.authorUserId))
        .where(
            and(
                eq(chatAttachments.channelId, channelId),
                isNull(chatMessages.deletedAt),
            ),
        )
        .orderBy(desc(chatAttachments.createdAt))
        .limit(PAGE_SIZE_HUGE);

    return rows.map((row) => ({
        ...toAttachmentView(row),
        messageId: row.messageId,
        authorName: row.authorName,
        createdAt: row.createdAt,
    }));
};

export const createChatAttachment = async (input: {
    channelId: string;
    uploadedBy: string;
    filename: string;
    name: string;
    contentType: string;
    sizeBytes: number;
}): Promise<ChatAttachmentView> => {
    const record = await insertOne(
        chatAttachments,
        input,
        'Не удалось сохранить файл',
    );

    return toAttachmentView(record);
};

export const attachToMessage = async (
    tx: Pick<Tx, 'update'>,
    input: {
        messageId: string;
        channelId: string;
        userId: string;
        attachmentIds: string[];
    },
): Promise<void> => {
    const ids = [...new Set(input.attachmentIds)];

    if (ids.length === 0) return;

    const attached = await tx
        .update(chatAttachments)
        .set({ messageId: input.messageId })
        .where(
            and(
                inArray(chatAttachments.id, ids),
                eq(chatAttachments.channelId, input.channelId),
                eq(chatAttachments.uploadedBy, input.userId),
                isNull(chatAttachments.messageId),
            ),
        )
        .returning({ id: chatAttachments.id });

    if (attached.length !== ids.length) {
        throw new ApplicationError('Вложение недоступно');
    }
};

export const messageHasAttachments = async (
    messageId: string,
): Promise<boolean> => {
    const [row] = await db
        .select({ id: chatAttachments.id })
        .from(chatAttachments)
        .where(eq(chatAttachments.messageId, messageId))
        .limit(1);

    return row !== undefined;
};

const findChatAttachmentByFile = async (
    channelId: string,
    filename: string,
): Promise<{
    attachment: ChatAttachmentRecord;
    channel: ChatChannelRecord;
    messageDeleted: boolean;
} | null> => {
    const [row] = await db
        .select({
            attachment: chatAttachments,
            channel: chatChannels,
            messageDeletedAt: chatMessages.deletedAt,
        })
        .from(chatAttachments)
        .innerJoin(chatChannels, eq(chatChannels.id, chatAttachments.channelId))
        .leftJoin(chatMessages, eq(chatMessages.id, chatAttachments.messageId))
        .where(
            and(
                eq(chatAttachments.channelId, channelId),
                eq(chatAttachments.filename, filename),
            ),
        )
        .limit(1);

    if (!row) return null;

    return {
        attachment: row.attachment,
        channel: row.channel,
        messageDeleted: row.messageDeletedAt !== null,
    };
};

export const parseChatTarget = (raw: FormDataEntryValue | null | undefined) => {
    if (typeof raw !== 'string') return null;

    try {
        const parsed = z.safeParse(ChatTargetSchema, JSON.parse(raw));

        return parsed.success ? parsed.data : null;
    } catch {
        return null;
    }
};

export const serveChatFile = async (
    userId: string,
    channelId: string,
    filename: string,
): Promise<Response> => {
    const found = await findChatAttachmentByFile(channelId, filename);

    if (!found || found.messageDeleted) return notFoundResponse();

    const { attachment, channel } = found;

    if (attachment.messageId === null && attachment.uploadedBy !== userId) {
        return notFoundResponse();
    }

    let organizationId: string;

    try {
        ({ id: organizationId } = await requireUserOrganization(userId));
        await assertChannelAccess(userId, organizationId, channel);
    } catch {
        return forbiddenResponse();
    }

    const disposition = attachment.contentType.startsWith('image/')
        ? 'inline'
        : `attachment; filename*=UTF-8''${encodeURIComponent(attachment.name)}`;

    return chatFileResponse(
        organizationId,
        channelId,
        filename,
        attachment.contentType,
        disposition,
    );
};
