import { ColorDot } from '@/shared/components/common';
import { fmtTime, fmtTimeRange } from '@/shared/format/date';
import { cn } from '@/shared/lib/utils';
import type { ProjectView } from '@/contexts/project';
import Link from 'next/link';
import { type AgendaItem, agendaHref, agendaNote, agendaPhase, agendaTitle } from '../lib/myDay';

interface AgendaRowProps {
    item: AgendaItem;
    project?: ProjectView;
    now: Date;
}

export const AgendaRow = ({ item, project, now }: AgendaRowProps) => {
    const phase = agendaPhase(item, now);

    return (
        <li>
            <Link
                href={agendaHref(item)}
                className={cn(
                    '-mx-2 grid grid-cols-[2.75rem_minmax(0,1fr)_auto] items-start gap-x-3 rounded-md border-l-2 border-transparent px-2 py-2 text-sm transition-colors hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                    phase === 'now' && 'border-violet-400 bg-violet-500/5',
                    phase === 'past' && 'opacity-50',
                )}
            >
                <span
                    className={cn(
                        'pt-px font-mono text-xs tabular-nums text-muted-foreground',
                        phase === 'now' && 'text-violet-300',
                    )}
                >
                    {fmtTime(item.startsAt)}
                </span>
                <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate font-medium">{agendaTitle(item)}</span>
                    <span className="flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
                        <ColorDot
                            color={project?.color}
                            className="size-2"
                        />
                        <span className="truncate">{project?.name ?? 'Проект'}</span>
                        <span aria-hidden>·</span>
                        <span className="shrink-0 tabular-nums">
                            {fmtTimeRange(item.startsAt, item.endsAt)}
                        </span>
                    </span>
                </span>
                <span
                    className={cn(
                        'pt-px text-[11px] text-muted-foreground',
                        phase === 'now' && 'font-medium text-violet-300',
                    )}
                >
                    {agendaNote(item, phase)}
                </span>
            </Link>
        </li>
    );
};
