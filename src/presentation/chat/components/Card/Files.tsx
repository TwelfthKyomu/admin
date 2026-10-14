import { fmtBytes } from '@/shared/format/bytes';
import { fmtDateTime } from '@/shared/format/date';
import type { ChannelAttachmentView } from '@/contexts/chat';
import {
    Attachment,
    AttachmentAction,
    AttachmentActions,
    AttachmentContent,
    AttachmentDescription,
    AttachmentMedia,
    AttachmentTitle,
} from '@/ui/Base';
import { Download } from 'lucide-react';
import { attachmentIcon } from '../../lib/attachments';
import { DELETED_AUTHOR } from '../../lib/text';
import { CardEmpty } from './Empty';

interface CardFilesProps {
    items: ChannelAttachmentView[];
}

export const CardFiles = ({ items }: CardFilesProps) => {
    if (items.length === 0) return <CardEmpty text="Файлов в переписке пока нет." />;

    return (
        <div className="flex flex-col gap-1.5">
            {items.map((file) => {
                const Icon = attachmentIcon(file.contentType);

                return (
                    <Attachment
                        key={file.id}
                        size="sm"
                        className="w-full rounded-[10px]"
                    >
                        <AttachmentMedia>
                            <Icon />
                        </AttachmentMedia>
                        <AttachmentContent>
                            <AttachmentTitle>{file.name}</AttachmentTitle>
                            <AttachmentDescription>
                                {fmtBytes(file.sizeBytes)} · {file.authorName ?? DELETED_AUTHOR} ·{' '}
                                {fmtDateTime(file.createdAt)}
                            </AttachmentDescription>
                        </AttachmentContent>
                        <AttachmentActions>
                            <AttachmentAction
                                asChild
                                aria-label={`Скачать ${file.name}`}
                            >
                                <a
                                    href={file.url}
                                    download={file.name}
                                >
                                    <Download />
                                </a>
                            </AttachmentAction>
                        </AttachmentActions>
                    </Attachment>
                );
            })}
        </div>
    );
};
