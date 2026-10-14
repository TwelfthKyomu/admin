import { useState } from 'react';
import { cn } from '@/shared/lib/utils';
import type { TaskStatus, TaskView } from '@/contexts/task';
import type { TaskActions } from '../../hooks/useTaskActions';
import { TASK_STATUS_META } from '../../lib/taskOptions';
import { OptionBadge } from '../OptionBadge';
import { TaskCard } from '../TaskCard';
import { QuickAdd } from './QuickAdd';

interface BoardColumnProps {
    status: TaskStatus;
    tasks: TaskView[];
    projectKey: string;
    memberNames: Map<string, string>;
    actions: TaskActions;
}

export const BoardColumn = ({
    status,
    tasks,
    projectKey,
    memberNames,
    actions,
}: BoardColumnProps) => {
    const [isOver, setIsOver] = useState(false);

    return (
        <ul
            className={cn(
                'flex max-h-full min-w-70 flex-col gap-2 rounded-lg border bg-muted/30 p-2',
                isOver && 'border-primary bg-primary/5',
            )}
            onDragOver={(event) => {
                event.preventDefault();
                setIsOver(true);
            }}
            onDragLeave={() => setIsOver(false)}
            onDrop={(event) => {
                event.preventDefault();
                setIsOver(false);

                const id = event.dataTransfer.getData('text/plain');

                if (id && !tasks.some((task) => task.id === id)) actions.onMove(id, status);
            }}
        >
            <li className="flex items-center gap-2 px-1 py-1">
                <OptionBadge meta={TASK_STATUS_META[status]} />
                <span className="font-mono text-xs text-muted-foreground">{tasks.length}</span>
            </li>
            {tasks.map((task) => (
                <TaskCard
                    key={task.id}
                    task={task}
                    projectKey={projectKey}
                    assigneeName={
                        task.assigneeUserId ? memberNames.get(task.assigneeUserId) : undefined
                    }
                    actions={actions}
                />
            ))}
            <li>
                <QuickAdd onAdd={(title) => actions.onQuickAdd(title, status)} />
            </li>
        </ul>
    );
};
