import { ROUTES } from '@/shared/constants';
import { fmtDayLabel } from '@/shared/format/date';
import { cn } from '@/shared/lib/utils';
import type { MyTaskView } from '@/contexts/task';
import { TASK_STATUS_META } from '@/presentation/projects/[projectId]/tasks/lib/taskOptions';
import Link from 'next/link';
import { isOverdue } from '../lib/myDay';

interface TaskRowProps {
    task: MyTaskView;
    today: Date;
}

export const TaskRow = ({ task, today }: TaskRowProps) => {
    const status = TASK_STATUS_META[task.status];
    const overdue = isOverdue(task.dueAt, today);

    return (
        <li>
            <Link
                href={ROUTES.project(task.projectId, 'tasks')}
                className="-mx-2 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 rounded-md px-2 py-2 text-sm transition-colors hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
                <status.icon
                    className="size-4"
                    style={{ color: status.color }}
                    aria-label={status.label}
                />
                <span className="flex min-w-0 items-baseline gap-2">
                    <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                        {task.projectKey}-{task.number}
                    </span>
                    <span className="truncate">{task.title}</span>
                </span>
                <span
                    className={cn(
                        'text-[11px] tabular-nums text-muted-foreground',
                        overdue && 'font-medium text-destructive',
                    )}
                >
                    {task.dueAt ? fmtDayLabel(new Date(task.dueAt)) : 'без срока'}
                </span>
            </Link>
        </li>
    );
};
