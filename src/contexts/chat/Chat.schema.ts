import {
    LABEL_MAX,
    PAGE_SIZE_LIMIT,
    SEARCH_QUERY_MIN,
    TEXT_MAX,
} from '@/shared/constants/default';
import { idSchema } from '@/shared/validation/base';
import * as z from 'zod/mini';
import { CHAT_ATTACHMENTS_PER_MESSAGE, CHAT_REACTIONS } from './Chat.types';

export const ChatTargetSchema = z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('organization') }),
    z.object({ kind: z.literal('project'), projectId: idSchema }),
    z.object({ kind: z.literal('direct'), channelId: idSchema }),
]);

const BodySchema = z.string().check(z.trim(), z.maxLength(TEXT_MAX));

export const ChatMessagesActionInputSchema = z.object({
    target: ChatTargetSchema,
    limit: z.optional(
        z.number().check(z.minimum(1), z.maximum(PAGE_SIZE_LIMIT)),
    ),
});

export const ChatTargetActionInputSchema = z.object({
    target: ChatTargetSchema,
});

export const ChatMessageSearchActionInputSchema = z.object({
    query: z
        .string()
        .check(z.trim(), z.minLength(SEARCH_QUERY_MIN), z.maxLength(LABEL_MAX)),
});

export const SendChatMessageActionInputSchema = z.object({
    target: ChatTargetSchema,
    body: BodySchema,
    replyToId: z.optional(idSchema),
    threadRootId: z.optional(idSchema),
    attachmentIds: z.optional(
        z.array(idSchema).check(z.maxLength(CHAT_ATTACHMENTS_PER_MESSAGE)),
    ),
});

export const EditChatMessageActionInputSchema = z.object({
    messageId: idSchema,
    body: BodySchema,
});

export const ChatMessageRefActionInputSchema = z.object({
    messageId: idSchema,
});

export const SetChatMessagePinActionInputSchema = z.object({
    messageId: idSchema,
    pinned: z.boolean(),
});

export const SetChatReactionActionInputSchema = z.object({
    messageId: idSchema,
    emoji: z.enum([...CHAT_REACTIONS]),
});

export const StartDirectChatActionInputSchema = z.object({
    otherUserId: idSchema,
});
