import { positive } from '@/infrastructure/database/checks';
import { createdAt, deletedAt, id } from '@/infrastructure/database/columns';
import { chatChannelTypeEnum } from '@/infrastructure/database/schemas/enums';
import { organizations } from '@/contexts/organization/Organizations.table';
import { projects } from '@/contexts/project/Projects.table';
import { users } from '@/contexts/user/Users.table';
import { sql } from 'drizzle-orm';
import {
    type AnyPgColumn,
    bigint,
    check,
    index,
    pgTable,
    primaryKey,
    text,
    timestamp,
    uniqueIndex,
    varchar,
} from 'drizzle-orm/pg-core';

export const chatChannels = pgTable(
    'chat_channels',
    {
        id,
        organizationId: text('organization_id')
            .notNull()
            .references(() => organizations.id, { onDelete: 'cascade' }),
        type: chatChannelTypeEnum('type').notNull(),
        projectId: text('project_id').references(() => projects.id, {
            onDelete: 'cascade',
        }),
        userAId: text('user_a_id').references(() => users.id, {
            onDelete: 'cascade',
        }),
        userBId: text('user_b_id').references(() => users.id, {
            onDelete: 'cascade',
        }),
        createdAt,
    },
    (t) => [
        check(
            'chat_channels_shape',
            sql`(
                (${t.type} = 'organization' and ${t.projectId} is null and ${t.userAId} is null and ${t.userBId} is null)
                or (${t.type} = 'project' and ${t.projectId} is not null and ${t.userAId} is null and ${t.userBId} is null)
                or (${t.type} = 'direct' and ${t.projectId} is null and ${t.userAId} is not null and ${t.userBId} is not null and ${t.userAId} < ${t.userBId})
            )`,
        ),
        uniqueIndex('chat_channels_org_unique')
            .on(t.organizationId)
            .where(sql`${t.type} = 'organization'`),
        uniqueIndex('chat_channels_project_unique')
            .on(t.projectId)
            .where(sql`${t.type} = 'project'`),
        uniqueIndex('chat_channels_direct_unique')
            .on(t.organizationId, t.userAId, t.userBId)
            .where(sql`${t.type} = 'direct'`),
        index('chat_channels_org_idx').on(t.organizationId),
        index('chat_channels_user_a_idx').on(t.userAId),
        index('chat_channels_user_b_idx').on(t.userBId),
    ],
);

export type ChatChannelRecord = typeof chatChannels.$inferSelect;

export const chatMessages = pgTable(
    'chat_messages',
    {
        id,
        channelId: text('channel_id')
            .notNull()
            .references(() => chatChannels.id, { onDelete: 'cascade' }),
        authorUserId: text('author_user_id').references(() => users.id, {
            onDelete: 'set null',
        }),
        replyToId: text('reply_to_id').references(
            (): AnyPgColumn => chatMessages.id,
            { onDelete: 'set null' },
        ),
        threadRootId: text('thread_root_id').references(
            (): AnyPgColumn => chatMessages.id,
            { onDelete: 'cascade' },
        ),
        body: text('body').notNull(),
        pinnedAt: timestamp('pinned_at'),
        editedAt: timestamp('edited_at'),
        deletedAt,
        createdAt,
    },
    (t) => [
        index('chat_messages_channel_created_idx').on(t.channelId, t.createdAt),
        index('chat_messages_author_idx').on(t.authorUserId),
        index('chat_messages_reply_idx').on(t.replyToId),
        index('chat_messages_thread_idx').on(t.threadRootId, t.createdAt),
        index('chat_messages_pinned_idx').on(t.channelId, t.pinnedAt),
    ],
);

export type ChatMessageRecord = typeof chatMessages.$inferSelect;

export const chatAttachments = pgTable(
    'chat_attachments',
    {
        id,
        channelId: text('channel_id')
            .notNull()
            .references(() => chatChannels.id, { onDelete: 'cascade' }),
        messageId: text('message_id').references(() => chatMessages.id, {
            onDelete: 'cascade',
        }),
        uploadedBy: text('uploaded_by').references(() => users.id, {
            onDelete: 'set null',
        }),
        filename: varchar('filename', { length: 64 }).notNull(),
        name: varchar('name', { length: 255 }).notNull(),
        contentType: varchar('content_type', { length: 128 }).notNull(),
        sizeBytes: bigint('size_bytes', { mode: 'number' }).notNull(),
        createdAt: timestamp('created_at').notNull().defaultNow(),
    },
    (t) => [
        uniqueIndex('chat_attachments_channel_filename_unique').on(
            t.channelId,
            t.filename,
        ),
        index('chat_attachments_message_idx').on(t.messageId),
        index('chat_attachments_channel_created_idx').on(
            t.channelId,
            t.createdAt,
        ),
        check('chat_attachments_size_positive', positive(t.sizeBytes)),
    ],
);

export type ChatAttachmentRecord = typeof chatAttachments.$inferSelect;

export const chatMessageReactions = pgTable(
    'chat_message_reactions',
    {
        messageId: text('message_id')
            .notNull()
            .references(() => chatMessages.id, { onDelete: 'cascade' }),
        userId: text('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        emoji: text('emoji').notNull(),
        createdAt: timestamp('created_at').notNull().defaultNow(),
    },
    (t) => [primaryKey({ columns: [t.messageId, t.userId] })],
);

export const chatReads = pgTable(
    'chat_reads',
    {
        channelId: text('channel_id')
            .notNull()
            .references(() => chatChannels.id, { onDelete: 'cascade' }),
        userId: text('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        lastReadAt: timestamp('last_read_at').notNull().defaultNow(),
    },
    (t) => [
        primaryKey({ columns: [t.channelId, t.userId] }),
        index('chat_reads_user_idx').on(t.userId),
    ],
);
