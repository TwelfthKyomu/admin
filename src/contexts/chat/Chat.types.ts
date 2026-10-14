import { enumValues } from '@/shared/lib/enum';
import type { OrganizationRole } from '@/contexts/organizationMember/OrganizationMember.types';
import type { ProjectRecord } from '@/contexts/project/Projects.table';
import type { UserRecord } from '@/contexts/user/Users.table';
import type {
    ChatAttachmentRecord,
    ChatChannelRecord,
    ChatMessageRecord,
} from './ChatChannels.table';

export const ChatChannelType = {
    ORGANIZATION: 'organization',
    PROJECT: 'project',
    DIRECT: 'direct',
} as const;

export type ChatChannelType =
    (typeof ChatChannelType)[keyof typeof ChatChannelType];

export const CHAT_CHANNEL_TYPE_VALUES = enumValues(ChatChannelType);

export type ChatTarget =
    | { kind: 'organization' }
    | { kind: 'project'; projectId: string }
    | { kind: 'direct'; channelId: string };

export const CHAT_SCOPE_PREFIX = {
    organization: 'chat:org:',
    project: 'chat:project:',
    direct: 'chat:dm:',
    channels: 'chat-channels:',
} as const;

export function chatScopeKey(
    organizationId: string,
    target: ChatTarget,
): string {
    if (target.kind === 'project') {
        return `${CHAT_SCOPE_PREFIX.project}${target.projectId}`;
    }
    if (target.kind === 'direct') {
        return `${CHAT_SCOPE_PREFIX.direct}${target.channelId}`;
    }

    return `${CHAT_SCOPE_PREFIX.organization}${organizationId}`;
}

export function chatChannelsScope(organizationId: string) {
    return `${CHAT_SCOPE_PREFIX.channels}${organizationId}`;
}

export function channelTarget(
    channel: Pick<ChatChannelRecord, 'id' | 'type' | 'projectId'>,
): ChatTarget {
    if (channel.type === ChatChannelType.PROJECT) {
        return { kind: 'project', projectId: channel.projectId ?? '' };
    }
    if (channel.type === ChatChannelType.DIRECT) {
        return { kind: 'direct', channelId: channel.id };
    }

    return { kind: 'organization' };
}

export const CHAT_REACTIONS = [
    '👍',
    '❤️',
    '😂',
    '🎉',
    '👀',
    '🔥',
    '✅',
] as const;

export type ChatReaction = (typeof CHAT_REACTIONS)[number];

export function isChatReaction(value: string): value is ChatReaction {
    return (CHAT_REACTIONS as readonly string[]).includes(value);
}

export function isChatParticipant(
    channel: ChatChannelRecord,
    userId: string,
): boolean {
    if (channel.type !== ChatChannelType.DIRECT) return false;

    return channel.userAId === userId || channel.userBId === userId;
}

export function directChannelPair(
    userId: string,
    otherUserId: string,
): [userAId: string, userBId: string] {
    return userId < otherUserId ? [userId, otherUserId] : [otherUserId, userId];
}

export type ChatUserView = Pick<UserRecord, 'id' | 'name' | 'image'>;

export type ChatContactView = ChatUserView &
    Pick<UserRecord, 'email'> & { role: OrganizationRole };

export type DirectChannelView = Pick<ChatChannelRecord, 'id' | 'createdAt'> & {
    otherUser: ChatUserView;
};

export type ChatProjectChannelView = Pick<
    ProjectRecord,
    'id' | 'name' | 'color'
>;

export type ChatLastMessageView = Pick<
    ChatMessageRecord,
    'body' | 'authorUserId' | 'createdAt'
> & {
    authorName: UserRecord['name'] | null;
};

export interface ChatChannelsView {
    canManage: boolean;
    projects: ChatProjectChannelView[];
    directs: DirectChannelView[];
    unread: Record<string, number>;
    lastMessages: Record<string, ChatLastMessageView>;
    readByOthers: Record<string, Date>;
}

export type ChatMessageReplyView = Pick<ChatMessageRecord, 'id'> & {
    authorName: UserRecord['name'] | null;
    body: ChatMessageRecord['body'] | null;
};

export interface ChatMessageTaskView {
    id: string;
    projectId: string;
    number: number;
    projectKey: string;
}

export interface ChatMessageReactionView {
    emoji: string;
    count: number;
    reacted: boolean;
}

export const CHAT_ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;

export const CHAT_ATTACHMENTS_PER_MESSAGE = 10;

export type ChatAttachmentView = Pick<
    ChatAttachmentRecord,
    'id' | 'name' | 'contentType' | 'sizeBytes'
> & {
    url: string;
};

export type ChannelAttachmentView = ChatAttachmentView & {
    messageId: ChatMessageRecord['id'];
    authorName: UserRecord['name'] | null;
    createdAt: ChatAttachmentRecord['createdAt'];
};

export function isImageAttachment(
    attachment: Pick<ChatAttachmentView, 'contentType'>,
): boolean {
    return attachment.contentType.startsWith('image/');
}

export type ChatMessageView = Pick<
    ChatMessageRecord,
    | 'id'
    | 'channelId'
    | 'authorUserId'
    | 'body'
    | 'createdAt'
    | 'editedAt'
    | 'pinnedAt'
> & {
    authorName: UserRecord['name'] | null;
    authorImage: UserRecord['image'];
    replyTo: ChatMessageReplyView | null;
    reactions: ChatMessageReactionView[];
    attachments: ChatAttachmentView[];
    threadReplies: number;
    task: ChatMessageTaskView | null;
};

export interface ChatThreadView {
    root: ChatMessageView;
    replies: ChatMessageView[];
}

export type ChatLinkView = Pick<ChatMessageRecord, 'createdAt'> & {
    messageId: ChatMessageRecord['id'];
    url: string;
    authorName: UserRecord['name'] | null;
};

export type ChatSearchResultView = Pick<
    ChatMessageRecord,
    'id' | 'body' | 'createdAt' | 'threadRootId'
> & {
    authorName: UserRecord['name'] | null;
    target: ChatTarget;
};

export function sortReactions(
    reactions: ChatMessageReactionView[],
): ChatMessageReactionView[] {
    const order = (emoji: string) => {
        const index = (CHAT_REACTIONS as readonly string[]).indexOf(emoji);

        return index === -1 ? CHAT_REACTIONS.length : index;
    };

    return reactions.sort((a, b) => order(a.emoji) - order(b.emoji));
}

export function setMessageReaction<
    T extends Pick<ChatMessageView, 'reactions'>,
>(message: T, emoji: string): T {
    const own = message.reactions.find((reaction) => reaction.reacted);
    const removeOwn = own !== undefined;
    const addNew = own?.emoji !== emoji;

    const reactions = message.reactions
        .map((reaction) => {
            if (removeOwn && reaction.emoji === own.emoji) {
                return {
                    ...reaction,
                    count: reaction.count - 1,
                    reacted: false,
                };
            }
            if (addNew && reaction.emoji === emoji) {
                return {
                    ...reaction,
                    count: reaction.count + 1,
                    reacted: true,
                };
            }

            return reaction;
        })
        .filter((reaction) => reaction.count > 0);

    const isNewEmoji =
        addNew &&
        !message.reactions.some((reaction) => reaction.emoji === emoji);

    if (isNewEmoji) reactions.push({ emoji, count: 1, reacted: true });

    return { ...message, reactions: sortReactions(reactions) };
}

const URL_PATTERN = /https?:\/\/[^\s<>"']+/gi;

const TRAILING_PUNCTUATION = /[.,;:!?)\]}»"']+$/;

export type MessageTextPart =
    | { kind: 'text'; value: string }
    | { kind: 'link'; value: string };

export function splitMessageText(text: string): MessageTextPart[] {
    const parts: MessageTextPart[] = [];
    let cursor = 0;

    for (const match of text.matchAll(URL_PATTERN)) {
        const start = match.index;
        const url = match[0].replace(TRAILING_PUNCTUATION, '');

        if (start === undefined || url.length === 0) continue;

        if (start > cursor) {
            parts.push({ kind: 'text', value: text.slice(cursor, start) });
        }

        parts.push({ kind: 'link', value: url });
        cursor = start + url.length;
    }

    if (cursor < text.length) {
        parts.push({ kind: 'text', value: text.slice(cursor) });
    }

    return parts;
}

export function extractUrls(text: string): string[] {
    return splitMessageText(text)
        .filter((part) => part.kind === 'link')
        .map((part) => part.value);
}

const IMAGE_EXTENSIONS = [
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.webp',
    '.avif',
    '.bmp',
];

export function isImageUrl(url: string): boolean {
    const withoutQuery = url.split(/[?#]/)[0]?.toLowerCase() ?? '';

    return IMAGE_EXTENSIONS.some((extension) =>
        withoutQuery.endsWith(extension),
    );
}
