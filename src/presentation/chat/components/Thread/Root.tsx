import type { ChatMessageView } from '@/contexts/chat';
import { Spinner } from '@/ui/Base';
import { DELETED_AUTHOR } from '../../lib/text';
import { MessageAttachments } from '../Message/Attachments';
import { MessageText } from '../Message/Text';

interface ThreadRootProps {
    root?: ChatMessageView;
    isPending: boolean;
}

export const ThreadRoot = ({ root, isPending }: ThreadRootProps) => {
    if (isPending) {
        return (
            <div className="flex justify-center py-3">
                <Spinner />
            </div>
        );
    }

    if (!root) {
        return (
            <p className="text-[12.5px] text-muted-foreground">
                Сообщение недоступно — возможно, его удалили.
            </p>
        );
    }

    return (
        <div className="rounded-[10px] border border-border bg-card px-[11px] py-2.5">
            <div className="mb-1 text-[11.5px] leading-[1.2] font-medium text-violet-400">
                {root.authorName ?? DELETED_AUTHOR}
            </div>
            {root.body && (
                <div className="text-[12.5px] leading-[1.45] break-words whitespace-pre-wrap">
                    <MessageText body={root.body} />
                </div>
            )}
            <MessageAttachments
                attachments={root.attachments}
                own={false}
            />
        </div>
    );
};
