import { cn } from '@/shared/lib/utils';
import { type InboxRow, inboxTime } from '../../lib/inbox';
import { ChannelChip } from '../ChannelChip';
import { ChatAvatar } from '../ChatAvatar';

interface InboxRowItemProps {
    row: InboxRow;
    active: boolean;
    onSelect: () => void;
}

export const InboxRowItem = ({ row, active, onSelect }: InboxRowItemProps) => (
    <button
        type="button"
        onClick={onSelect}
        aria-current={active ? 'true' : undefined}
        className={cn(
            'flex w-full items-start gap-2.5 rounded-[10px] border px-2.5 py-[9px] text-left transition-colors',
            active ? 'border-border bg-muted' : 'border-transparent hover:bg-foreground/5',
        )}
    >
        <ChatAvatar
            name={row.title}
            image={row.image}
            seed={row.userId}
            initials={row.userId ? undefined : row.initials}
        />
        <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
            <span className="flex items-baseline gap-1.5">
                <span
                    className={cn(
                        'flex-1 truncate text-[13px] leading-[1.3]',
                        row.unread > 0 ? 'font-semibold' : 'font-medium',
                    )}
                >
                    {row.title}
                </span>
                <span className="shrink-0 font-mono text-[10.5px] leading-none text-muted-foreground">
                    {inboxTime(row.lastAt)}
                </span>
            </span>
            <span className="flex items-center gap-1.5">
                <ChannelChip direct={row.target.kind === 'direct'} />
                <span
                    className={cn(
                        'flex-1 truncate text-[12px] leading-[1.35]',
                        row.unread > 0 ? 'text-neutral-200' : 'text-muted-foreground',
                    )}
                >
                    {row.preview}
                </span>
                {row.hasDraft && <span className="size-1.5 shrink-0 rounded-full bg-amber-300" />}
                {row.unread > 0 && (
                    <span className="h-[18px] min-w-[18px] shrink-0 rounded-full bg-violet-500 px-[5px] text-center font-mono text-[10.5px] leading-[18px] font-semibold text-white">
                        {row.unread > 99 ? '99+' : row.unread}
                    </span>
                )}
            </span>
        </span>
    </button>
);
