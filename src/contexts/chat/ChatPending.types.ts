import type { sendChatMessageAction } from './ChatMessage.actions';
import type {
    ChatAttachmentView,
    ChatMessageView,
    ChatUserView,
} from './index';

const PENDING_PREFIX = 'pending:';

export type ChatSendInput = Parameters<typeof sendChatMessageAction>[0] & {
    attachments?: ChatAttachmentView[];
};

export const isPendingMessage = (id: string) => {
    return id.startsWith(PENDING_PREFIX);
};

export const pendingMessage = (
    input: ChatSendInput,
    author: ChatUserView,
    loaded: ChatMessageView[],
): ChatMessageView => {
    const replyTo = loaded.find((message) => message.id === input.replyToId);

    return {
        id: `${PENDING_PREFIX}${crypto.randomUUID()}`,
        channelId: '',
        authorUserId: author.id,
        authorName: author.name,
        authorImage: author.image,
        body: input.body,
        createdAt: new Date(),
        replyTo: replyTo && {
            id: replyTo.id,
            authorName: replyTo.authorName,
            body: replyTo.body,
        },
        reactions: [],
        attachments: input.attachments ?? [],
        threadReplies: 0,
    };
};
