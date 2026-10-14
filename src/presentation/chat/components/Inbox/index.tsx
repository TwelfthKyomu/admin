'use client';

import { cn } from '@/shared/lib/utils';
import {
    type ChatChannelsView,
    type ChatSearchResultView,
    type ChatTarget,
    chatScopeKey,
} from '@/contexts/chat';
import { useInbox } from '../../hooks/useInbox';
import { InboxFolders } from './Folders';
import { InboxHits } from './Hits';
import { InboxRowItem } from './Row';
import { InboxSearch } from './Search';

interface InboxProps {
    organizationId: string;
    organizationName: string;
    channels: ChatChannelsView;
    viewerId: string;
    activeScope: string;
    open: boolean;
    onSelect: (target: ChatTarget) => void;
    onSelectHit: (hit: ChatSearchResultView) => void;
    onStartDm: () => void;
}

export const Inbox = ({
    organizationId,
    organizationName,
    channels,
    viewerId,
    activeScope,
    open,
    onSelect,
    onSelectHit,
    onStartDm,
}: InboxProps) => {
    const inbox = useInbox({
        organizationId,
        organizationName,
        channels,
        viewerId,
        activeScope,
    });

    return (
        <section
            className={cn(
                'w-full shrink-0 flex-col overflow-hidden border-r border-border bg-card/40',
                '@3xl/chat:flex @3xl/chat:w-[284px] @5xl/chat:w-[300px] @6xl/chat:w-[326px]',
                open ? 'flex' : 'hidden',
            )}
        >
            <div className="flex flex-col gap-2 px-3 pt-3 pb-2">
                <InboxSearch
                    value={inbox.query}
                    onChange={inbox.setQuery}
                    inputRef={inbox.searchRef}
                    onStartDm={onStartDm}
                />
                <InboxFolders
                    value={inbox.folder}
                    counts={inbox.counts}
                    onChange={inbox.setFolder}
                />
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-2 pt-1 pb-2.5">
                {inbox.rows.map((row) => (
                    <InboxRowItem
                        key={row.scope}
                        row={row}
                        active={row.scope === activeScope}
                        onSelect={() => onSelect(row.target)}
                    />
                ))}

                {inbox.rows.length === 0 && (
                    <p className="px-3.5 py-7 text-center text-[12.5px] leading-normal text-muted-foreground">
                        Ничего не найдено.
                        <br />
                        Попробуйте изменить запрос или фильтр.
                    </p>
                )}

                {inbox.searching && (
                    <InboxHits
                        hits={inbox.hits}
                        isPending={inbox.hitsPending}
                        titleOf={(hit) => inbox.titleOf(chatScopeKey(organizationId, hit.target))}
                        onSelect={onSelectHit}
                    />
                )}
            </div>
        </section>
    );
};
