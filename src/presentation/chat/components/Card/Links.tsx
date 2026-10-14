import { fmtDateTime } from '@/shared/format/date';
import type { ChatLinkView } from '@/contexts/chat';
import { DELETED_AUTHOR } from '../../lib/text';
import { CardEmpty } from './Empty';

interface CardLinksProps {
    items: ChatLinkView[];
}

export const CardLinks = ({ items }: CardLinksProps) => {
    if (items.length === 0) return <CardEmpty text="Ссылок в переписке пока нет." />;

    return (
        <div className="flex flex-col gap-1.5">
            {items.map((link, index) => (
                <a
                    key={`${link.messageId}-${index}`}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="flex flex-col gap-1 rounded-[10px] border border-border bg-card px-[11px] py-2.5 transition-colors hover:bg-muted/40"
                >
                    <span className="truncate text-[12.5px] leading-[1.35] text-violet-400">
                        {link.url}
                    </span>
                    <span className="truncate font-mono text-[11px] leading-none text-muted-foreground">
                        {link.authorName ?? DELETED_AUTHOR} · {fmtDateTime(link.createdAt)}
                    </span>
                </a>
            ))}
        </div>
    );
};
