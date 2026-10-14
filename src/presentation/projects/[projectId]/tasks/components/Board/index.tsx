import { TASK_STATUS_VALUES, type TaskView } from '@/contexts/task';
import type { TaskActions } from '../../hooks/useTaskActions';
import { BoardColumn } from './Column';

interface TaskBoardProps {
    tasks: TaskView[];
    projectKey: string;
    memberNames: Map<string, string>;
    actions: TaskActions;
}

export const TaskBoard = ({ tasks, projectKey, memberNames, actions }: TaskBoardProps) => (
    <div className="grid auto-cols-[minmax(280px,1fr)] grid-flow-col gap-3 overflow-x-auto pb-2">
        {TASK_STATUS_VALUES.map((status) => (
            <BoardColumn
                key={status}
                status={status}
                tasks={tasks.filter((task) => task.status === status)}
                projectKey={projectKey}
                memberNames={memberNames}
                actions={actions}
            />
        ))}
    </div>
);
