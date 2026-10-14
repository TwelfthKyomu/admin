import { fmtDateShort } from '@/shared/format/date';
import { cn } from '@/shared/lib/utils';
import type { TaskView } from '@/contexts/task';
import { Calendar } from 'lucide-react';
import { isOverdue } from '../lib/tasks';

export const DueChip = ({ task }: { task: TaskView }) => {
    if (!task.dueAt) return null;

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 text-xs text-muted-foreground tabular-nums',
                isOverdue(task) && 'text-destructive',
            )}
        >
            <Calendar className="size-3.5" />
            {fmtDateShort(new Date(task.dueAt))}
        </span>
    );
};
