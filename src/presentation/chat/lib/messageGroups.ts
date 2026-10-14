import { fmtDayLabel } from '@/shared/format/date';
import type { ChatMessageView } from '@/contexts/chat';
import { DELETED_AUTHOR } from './text';

export interface ChatMessageGroup {
    key: string;
    dayLabel?: string;
    unreadStart: boolean;
    authorUserId?: string;
    authorName: string;
    authorImage?: string;
    messages: ChatMessageView[];
}

const GROUP_WINDOW_MS = 5 * 60 * 1000;

interface GroupOptions {
    unreadAnchorId?: string;
}

export function groupMessages(
    messages: ChatMessageView[],
    { unreadAnchorId }: GroupOptions = {},
): ChatMessageGroup[] {
    const groups: ChatMessageGroup[] = [];

    for (const message of messages) {
        const createdAt = new Date(message.createdAt);
        const previous = groups.at(-1);
        const previousLast = previous?.messages.at(-1);

        const previousAt = previousLast
            ? new Date(previousLast.createdAt)
            : undefined;

        const sameDay = previousAt?.toDateString() === createdAt.toDateString();
        const unreadStart = message.id === unreadAnchorId;

        if (
            previous &&
            previousAt &&
            sameDay &&
            !unreadStart &&
            previous.authorUserId === message.authorUserId &&
            createdAt.getTime() - previousAt.getTime() < GROUP_WINDOW_MS
        ) {
            previous.messages.push(message);
            continue;
        }

        groups.push({
            key: message.id,
            dayLabel: sameDay ? undefined : fmtDayLabel(createdAt),
            unreadStart,
            authorUserId: message.authorUserId,
            authorName: message.authorName ?? DELETED_AUTHOR,
            authorImage: message.authorImage,
            messages: [message],
        });
    }

    return groups;
}

export function isReadByOthers(createdAt: Date, othersReadAt?: Date): boolean {
    return (
        !!othersReadAt &&
        new Date(createdAt).getTime() <= new Date(othersReadAt).getTime()
    );
}
