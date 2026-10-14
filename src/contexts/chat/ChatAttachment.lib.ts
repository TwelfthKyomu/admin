import 'server-only';

import { db, type Tx } from '@/infrastructure/database/client';
import { chatUploadUrl } from '@/infrastructure/storage/uploads';
import { ApplicationError } from '@/shared/api/errors';
import { insertOne } from '@/shared/api/repository';
import { PAGE_SIZE_HUGE } from '@/shared/constants/default';
import { users } from '@/contexts/user/Users.table';
import { and, desc, eq, inArray, isNull } from 'drizzle-orm';
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

function toAttachmentView(row: AttachmentRow): ChatAttachmentView {
    return {
        id: row.id,
        name: row.name,
        contentType: row.contentType,
        sizeBytes: row.sizeBytes,
        url: chatUploadUrl(row.channelId, row.filename),
    };
}

const attachmentColumns = {
    id: chatAttachments.id,
    channelId: chatAttachments.channelId,
    filename: chatAttachments.filename,
    name: chatAttachments.name,
    contentType: chatAttachments.contentType,
    sizeBytes: chatAttachments.sizeBytes,
};

export async function loadAttachments(
    messageIds: string[],
): Promise<Map<string, ChatAttachmentView[]>> {
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
}

export async function listChannelAttachments(
    channelId: string,
): Promise<ChannelAttachmentView[]> {
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
}

export async function createChatAttachment(input: {
    channelId: string;
    uploadedBy: string;
    filename: string;
    name: string;
    contentType: string;
    sizeBytes: number;
}): Promise<ChatAttachmentView> {
    const record = await insertOne(
        chatAttachments,
        input,
        'Не удалось сохранить файл',
    );

    return toAttachmentView(record);
}

export async function attachToMessage(
    tx: Pick<Tx, 'update'>,
    input: {
        messageId: string;
        channelId: string;
        userId: string;
        attachmentIds: string[];
    },
): Promise<void> {
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
}

export async function messageHasAttachments(
    messageId: string,
): Promise<boolean> {
    const [row] = await db
        .select({ id: chatAttachments.id })
        .from(chatAttachments)
        .where(eq(chatAttachments.messageId, messageId))
        .limit(1);

    return row !== undefined;
}

export async function findChatAttachmentByFile(
    channelId: string,
    filename: string,
): Promise<{
    attachment: ChatAttachmentRecord;
    channel: ChatChannelRecord;
    messageDeleted: boolean;
} | null> {
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
}
