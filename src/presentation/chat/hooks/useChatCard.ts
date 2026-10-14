'use client';

import { useState } from 'react';
import {
    type ChatContactView,
    type ChatTarget,
    isImageAttachment,
    isImageUrl,
    useChatAttachments,
    useChatLinks,
} from '@/contexts/chat';
import type { ChatConversation } from '../lib/conversation';

export interface CardMediaItem {
    key: string;
    url: string;
    alt: string;
    external: boolean;
}

interface UseChatCardOptions {
    target: ChatTarget;
    scope: string;
    conversation: ChatConversation;
    profileUserId?: string;
    contacts: ChatContactView[];
}

export function useChatCard({
    target,
    scope,
    conversation,
    profileUserId,
    contacts,
}: UseChatCardOptions) {
    const [broken, setBroken] = useState<ReadonlySet<string>>(new Set());

    const links = useChatLinks(scope, target);
    const attachments = useChatAttachments(scope, target);

    const foundLinks = links.data ?? [];
    const foundAttachments = attachments.data ?? [];

    const media: CardMediaItem[] = [
        ...foundAttachments.filter(isImageAttachment).map((attachment) => ({
            key: attachment.id,
            url: attachment.url,
            alt: attachment.name,
            external: false,
        })),
        ...foundLinks
            .filter((link) => isImageUrl(link.url) && !broken.has(link.url))
            .map((link, index) => ({
                key: `${link.messageId}-${index}`,
                url: link.url,
                alt: `Изображение от ${link.authorName ?? 'участника'}`,
                external: true,
            })),
    ];

    const personId = profileUserId ?? conversation.userId;

    return {
        personId,
        person: personId
            ? contacts.find((contact) => contact.id === personId)
            : undefined,
        media,
        files: foundAttachments.filter(
            (attachment) => !isImageAttachment(attachment),
        ),
        links: foundLinks.filter((link) => !isImageUrl(link.url)),
        isPending: links.isPending || attachments.isPending,
        markBroken: (url: string) =>
            setBroken((previous) => new Set(previous).add(url)),
    };
}
