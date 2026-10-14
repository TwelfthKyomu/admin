'use client';

import { fmtBytes } from '@/shared/format/bytes';
import { cn } from '@/shared/lib/utils';
import { type ChatAttachmentView, isImageAttachment } from '@/contexts/chat';
import {
    Attachment,
    AttachmentContent,
    AttachmentDescription,
    AttachmentMedia,
    AttachmentTitle,
    AttachmentTrigger,
} from '@/ui/Base';
import { Paperclip } from 'lucide-react';

interface MessageAttachmentsProps {
    attachments: ChatAttachmentView[];
    own: boolean;
}

export const MessageAttachments = ({ attachments, own }: MessageAttachmentsProps) => {
    if (attachments.length === 0) return null;

    const images = attachments.filter(isImageAttachment);
    const files = attachments.filter((attachment) => !isImageAttachment(attachment));

    return (
        <div className="mt-[7px] flex flex-col gap-[5px] first:mt-0">
            {images.length > 0 && (
                <div className="flex flex-wrap gap-[5px]">
                    {images.map((image) => (
                        <Attachment
                            key={image.id}
                            size="xs"
                            orientation="vertical"
                            className="w-36"
                        >
                            <AttachmentMedia variant="image">
                                {/* biome-ignore lint/performance/noImgElement: файл отдаёт /files с проверкой доступа, next/image его не оптимизирует */}
                                <img
                                    src={image.url}
                                    alt={image.name}
                                    loading="lazy"
                                />
                            </AttachmentMedia>
                            <AttachmentTrigger asChild>
                                <a
                                    href={image.url}
                                    target="_blank"
                                    rel="noopener"
                                >
                                    <span className="sr-only">Открыть {image.name}</span>
                                </a>
                            </AttachmentTrigger>
                        </Attachment>
                    ))}
                </div>
            )}

            {files.map((file) => (
                <Attachment
                    key={file.id}
                    size="xs"
                    className={cn(
                        'w-full min-w-0 items-center gap-2 rounded-lg',
                        'has-data-[slot=attachment-content]:px-[9px] has-data-[slot=attachment-content]:py-[7px]',
                        'has-data-[slot=attachment-media]:px-[9px] has-data-[slot=attachment-media]:py-[7px]',
                        own
                            ? 'border-black/15 bg-black/[0.06] text-primary-foreground'
                            : 'border-foreground/12 bg-foreground/[0.04] text-foreground',
                    )}
                >
                    <AttachmentMedia className="aspect-auto bg-transparent text-current opacity-70 group-data-[size=xs]/attachment:w-auto">
                        <Paperclip className="size-[15px]" />
                    </AttachmentMedia>
                    <AttachmentContent className="flex min-w-0 flex-1 flex-row items-center gap-2">
                        <AttachmentTitle className="truncate font-mono text-[12px] leading-[1.2] font-normal">
                            {file.name}
                        </AttachmentTitle>
                        <AttachmentDescription className="ml-auto shrink-0 font-mono text-[11px] leading-[1.2] text-current opacity-60">
                            {fmtBytes(file.sizeBytes)}
                        </AttachmentDescription>
                    </AttachmentContent>
                    <AttachmentTrigger asChild>
                        <a
                            href={file.url}
                            download={file.name}
                        >
                            <span className="sr-only">Скачать {file.name}</span>
                        </a>
                    </AttachmentTrigger>
                </Attachment>
            ))}
        </div>
    );
};
