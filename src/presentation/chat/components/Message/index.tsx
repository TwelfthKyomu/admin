'use client';

import { Fragment } from 'react';
import { type ChatMessageGroup, isReadByOthers } from '../../lib/messageGroups';
import type { MessageHandlers } from '../../lib/messageHandlers';
import { FeedMarker } from './FeedMarker';
import { MessageRow } from './Row';

interface MessageListProps extends MessageHandlers {
    groups: ChatMessageGroup[];
    ownUserId: string;
    showAuthors: boolean;
    canModerate: boolean;
    editingId?: string;
    highlightId?: string;
    othersReadAt?: Date;
}

export const MessageList = ({
    groups,
    ownUserId,
    showAuthors,
    canModerate,
    editingId,
    highlightId,
    othersReadAt,
    ...handlers
}: MessageListProps) =>
    groups.map((group, groupIndex) => (
        <Fragment key={group.key}>
            {group.dayLabel && <FeedMarker label={group.dayLabel} />}
            {group.unreadStart && (
                <FeedMarker
                    label="Новые сообщения"
                    unread
                />
            )}
            {group.messages.map((message, index) => {
                const own = group.authorUserId === ownUserId;

                return (
                    <MessageRow
                        key={message.id}
                        message={message}
                        authorName={group.authorName}
                        authorImage={group.authorImage}
                        own={own}
                        showAuthor={showAuthors && !own && index === 0}
                        topmost={groupIndex === 0 && index === 0}
                        read={isReadByOthers(message.createdAt, othersReadAt)}
                        canModerate={canModerate}
                        editing={editingId === message.id}
                        highlighted={highlightId === message.id}
                        {...handlers}
                    />
                );
            })}
        </Fragment>
    ));
