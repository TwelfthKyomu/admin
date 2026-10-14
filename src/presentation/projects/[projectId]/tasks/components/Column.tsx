import type { TaskView } from '@/contexts/task';
import { createColumnHelper } from '@tanstack/react-table';
import type { TaskActions } from '../hooks/useTaskActions';
import { TASK_PRIORITY_META, TASK_STATUS_META } from '../lib/taskOptions';
import { taskKey } from '../lib/tasks';
import { DueChip } from './DueChip';
import { OptionBadge } from './OptionBadge';
import { TaskMenu } from './TaskMenu';

const { accessor, display } = createColumnHelper<TaskView>();

interface ColumnsProps {
    projectKey: string;
    memberNames: Map<string, string>;
    actions: TaskActions;
}

export const COLUMNS = ({ projectKey, memberNames, actions }: ColumnsProps) => [
    accessor('title', {
        header: 'Задача',
        cell: ({ row: { original } }) => (
            <button
                type="button"
                className="text-left hover:underline"
                onClick={() => actions.onEdit(original)}
            >
                <div>{taskKey(projectKey, original)}</div>
                <div>{original.title}</div>
            </button>
        ),
    }),
    accessor('status', {
        header: 'Статус',
        cell: ({ getValue }) => <OptionBadge meta={TASK_STATUS_META[getValue()]} />,
    }),
    accessor('priority', {
        header: 'Приоритет',
        cell: ({ getValue }) => <OptionBadge meta={TASK_PRIORITY_META[getValue()]} />,
    }),
    accessor('assigneeUserId', {
        header: 'Исполнитель',
        cell: ({ getValue }) => {
            const id = getValue();

            return id ? (memberNames.get(id) ?? '—') : 'Не назначено';
        },
    }),
    accessor('dueAt', {
        header: 'Срок',
        cell: ({ row: { original } }) => <DueChip task={original} />,
    }),
    display({
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: ({ row: { original } }) => (
            <TaskMenu
                task={original}
                actions={actions}
            />
        ),
    }),
];
