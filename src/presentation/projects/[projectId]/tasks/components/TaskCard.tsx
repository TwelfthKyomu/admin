import { UserAvatar } from '@/shared/components/common';
import { TaskPriority, type TaskView } from '@/contexts/task';
import { Progress } from '@/ui/Base';
import type { TaskActions } from '../hooks/useTaskActions';
import { TASK_PRIORITY_META } from '../lib/taskOptions';
import { subtaskProgress, taskKey } from '../lib/tasks';
import { DueChip } from './DueChip';
import { OptionBadge } from './OptionBadge';
import { TaskMenu } from './TaskMenu';

interface TaskCardProps {
    task: TaskView;
    projectKey: string;
    assigneeName?: string;
    actions: TaskActions;
}

export const TaskCard = ({ task, projectKey, assigneeName, actions }: TaskCardProps) => {
    const progress = subtaskProgress(task);

    return (
        <li
            draggable
            onDragStart={(event) => event.dataTransfer.setData('text/plain', task.id)}
            className="group list-none rounded-lg border bg-card p-3 text-card-foreground shadow-xs transition-colors hover:border-primary/40"
        >
            <div className="mb-2 flex items-center gap-2">
                {task.priority !== TaskPriority.NONE && (
                    <OptionBadge meta={TASK_PRIORITY_META[task.priority]} />
                )}
                <span className="truncate font-mono text-xs text-muted-foreground">
                    {taskKey(projectKey, task)}
                </span>
                <div className="ml-auto">
                    <TaskMenu
                        task={task}
                        actions={actions}
                    />
                </div>
            </div>
            <button
                type="button"
                className="block w-full text-left"
                onClick={() => actions.onEdit(task)}
            >
                <p className="mb-2 line-clamp-3 text-sm font-medium leading-5">{task.title}</p>
                {progress && (
                    <div className="mb-3 flex items-center gap-2">
                        <Progress value={progress.percent} />
                        <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                            {progress.done}/{progress.total}
                        </span>
                    </div>
                )}
                <div className="flex items-center justify-between gap-2">
                    <DueChip task={task} />
                    {assigneeName && (
                        <UserAvatar
                            name={assigneeName}
                            size="sm"
                        />
                    )}
                </div>
            </button>
        </li>
    );
};
