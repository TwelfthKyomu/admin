'use client';

import { AttachmentMedia, Spinner } from '@/ui/Base';
import type { PendingAttachment } from '../../hooks/useChatComposer';
import { attachmentIcon } from '../../lib/attachments';

export const PendingMedia = ({ item }: { item: PendingAttachment }) => {
    if (item.status === 'uploading') {
        return (
            <AttachmentMedia>
                <Spinner />
            </AttachmentMedia>
        );
    }

    if (item.attachment && item.contentType.startsWith('image/')) {
        return (
            <AttachmentMedia variant="image">
                {/* biome-ignore lint/performance/noImgElement: файл отдаёт /files с проверкой доступа, next/image его не оптимизирует */}
                <img
                    src={item.attachment.url}
                    alt=""
                />
            </AttachmentMedia>
        );
    }

    const Icon = attachmentIcon(item.contentType);

    return (
        <AttachmentMedia>
            <Icon />
        </AttachmentMedia>
    );
};
