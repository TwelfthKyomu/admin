import { fmtDateTime } from '@/shared/format/date';
import type { ChatSearchResultView } from '@/contexts/chat';
import { Spinner } from '@/ui/Base';
import { ATTACHMENT_ONLY_BODY, DELETED_AUTHOR } from '../../lib/text';

interface InboxHitsProps {
    hits: ChatSearchResultView[];
    isPending: boolean;
    titleOf: (hit: ChatSearchResultView) => string;
    onSelect: (hit: ChatSearchResultView) => void;
}

export const InboxHits = ({ hits, isPending, titleOf, onSelect }: InboxHitsProps) => (
    <div className="mt-2 flex flex-col gap-0.5">
        <div className="flex items-center gap-2 px-2.5 pt-2 pb-1">
            <span className="text-[10px] leading-[1.2] font-medium tracking-[0.05em] text-muted-foreground uppercase">
                Сообщения
            </span>
            <span className="flex-1" />
            {isPending ? (
                <Spinner className="size-3" />
            ) : (
                <span className="font-mono text-[11px] text-muted-foreground">{hits.length}</span>
            )}
        </div>
        {!isPending && hits.length === 0 && (
            <p className="px-2.5 py-3 text-[12px] text-muted-foreground">
                В сообщениях ничего не найдено.
            </p>
        )}
        {hits.map((hit) => (
            <button
                key={hit.id}
                type="button"
                onClick={() => onSelect(hit)}
                className="flex flex-col gap-1 rounded-[10px] px-2.5 py-2 text-left transition-colors hover:bg-foreground/5"
            >
                <span className="flex items-baseline gap-1.5">
                    <span className="flex-1 truncate text-[12px] font-medium">
                        {hit.authorName ?? DELETED_AUTHOR}
                        <span className="font-normal text-muted-foreground"> · {titleOf(hit)}</span>
                    </span>
                    <span className="shrink-0 font-mono text-[10.5px] text-muted-foreground">
                        {fmtDateTime(hit.createdAt)}
                    </span>
                </span>
                <span className="line-clamp-2 text-[12px] leading-[1.35] text-muted-foreground">
                    {hit.body || ATTACHMENT_ONLY_BODY}
                </span>
            </button>
        ))}
    </div>
);
