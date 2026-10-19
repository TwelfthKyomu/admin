import { ColorDot } from '@/shared/components/common';
import type { MySalesView } from '@/contexts/order';
import type { ProjectView } from '@/contexts/project';
import { earnedLine, salesLine } from '../lib/mySales';

interface MySalesRowProps {
    item: MySalesView;
    project?: ProjectView;
}

export const MySalesRow = ({ item, project }: MySalesRowProps) => (
    <li className="grid gap-1.5 text-sm">
        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <ColorDot
                color={project?.color}
                className="size-2"
            />
            {project?.name ?? 'Проект'}
        </span>
        <span className="grid grid-cols-[4rem_minmax(0,1fr)] gap-x-3 gap-y-0.5 tabular-nums">
            <span className="text-muted-foreground">Сегодня</span>
            <span>
                {salesLine(item.today, item.currency)}
                <span className="block text-[11px] text-muted-foreground">
                    {earnedLine(item.today, item.currency)}
                </span>
            </span>
            <span className="text-muted-foreground">Месяц</span>
            <span>
                {salesLine(item.month, item.currency)}
                <span className="block text-[11px] text-muted-foreground">
                    {earnedLine(item.month, item.currency)}
                </span>
            </span>
        </span>
    </li>
);
