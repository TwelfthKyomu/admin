import { NONE } from '@/shared/lib/none';
import { matchesSearch } from '@/shared/lib/search';
import type { Option } from '@/shared/types';
import { type TaskPriority, TaskStatus, type TaskView } from '@/contexts/task';
import { startOfDay } from 'date-fns';
import { TASK_PRIORITY_ORDER } from './taskOptions';

export type TaskSort = 'priority' | 'due' | 'number' | 'title';

export interface TaskFilterValues {
    search: string;
    priority: TaskPriority | 'all';
    assignee: string;
    sort: TaskSort;
}

export const SORT_OPTIONS: Option<TaskSort>[] = [
    { value: 'priority', label: 'По приоритету' },
    { value: 'due', label: 'По сроку' },
    { value: 'number', label: 'По номеру' },
    { value: 'title', label: 'По названию' },
];

const NO_DUE = Number.MAX_SAFE_INTEGER;

export function taskKey(projectKey: string, task: TaskView): string {
    return `${projectKey}-${task.number}`;
}

export function isOverdue(task: TaskView): boolean {
    if (!task.dueAt || task.status === TaskStatus.DONE) return false;

    return new Date(task.dueAt) < startOfDay(new Date());
}

export function subtaskProgress(task: Pick<TaskView, 'subtasks'>) {
    const total = task.subtasks.length;

    if (total === 0) return null;

    const done = task.subtasks.filter((subtask) => subtask.done).length;

    return { done, total, percent: Math.round((done / total) * 100) };
}

function matches(
    task: TaskView,
    { search, priority, assignee }: TaskFilterValues,
): boolean {
    if (!matchesSearch(search, task.title, task.number, task.description)) {
        return false;
    }

    if (priority !== 'all' && task.priority !== priority) return false;
    if (assignee === 'all') return true;

    return (task.assigneeUserId ?? NONE) === assignee;
}

function compare(a: TaskView, b: TaskView, sort: TaskSort): number {
    if (sort === 'priority') {
        return (
            TASK_PRIORITY_ORDER.indexOf(a.priority) -
            TASK_PRIORITY_ORDER.indexOf(b.priority)
        );
    }

    if (sort === 'due') {
        return (a.dueAt?.getTime() ?? NO_DUE) - (b.dueAt?.getTime() ?? NO_DUE);
    }

    if (sort === 'title') return a.title.localeCompare(b.title, 'ru');

    return a.number - b.number;
}

export function filterTasks(
    tasks: TaskView[],
    filters: TaskFilterValues,
): TaskView[] {
    return tasks
        .filter((task) => matches(task, filters))
        .sort((a, b) => compare(a, b, filters.sort));
}
