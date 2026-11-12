'use client';

import { fmtBytes } from '@/shared/format/bytes';
import {
    Attachment,
    AttachmentAction,
    AttachmentActions,
    AttachmentContent,
    AttachmentDescription,
    AttachmentGroup,
    AttachmentTitle,
} from '@/ui/Base';
import { X } from 'lucide-react';
import type { PendingAttachment } from '../../hooks/useChatComposer';
import { PendingMedia } from './PendingMedia';

interface PendingAttachmentsProps {
    items: PendingAttachment[];
    onRemove: (key: string) => void;
}

export const PendingAttachments = ({ items, onRemove }: PendingAttachmentsProps) => {
    if (items.length === 0) return null;

    return (
        <AttachmentGroup className="mb-2 gap-1.5">
            {items.map((item) => (
                <Attachment
                    key={item.key}
                    size="xs"
                    state={item.status}
                    className="max-w-60 min-w-0 rounded-lg bg-muted/40"
                >
                    <PendingMedia item={item} />
                    <AttachmentContent>
                        <AttachmentTitle>{item.name}</AttachmentTitle>
                        <AttachmentDescription title={item.error ?? undefined}>
                            {item.status === 'error' ? item.error : fmtBytes(item.sizeBytes)}
                        </AttachmentDescription>
                    </AttachmentContent>
                    <AttachmentActions>
                        <AttachmentAction
                            onClick={() => onRemove(item.key)}
                            aria-label={`Убрать ${item.name}`}
                        >
                            <X />
                        </AttachmentAction>
                    </AttachmentActions>
                </Attachment>
            ))}
        </AttachmentGroup>
    );
};
