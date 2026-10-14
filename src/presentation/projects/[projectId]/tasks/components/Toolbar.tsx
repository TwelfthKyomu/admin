import type { Option } from '@/shared/types';
import { Button, Input, Select, type TabItem, Tabs } from '@/ui/Base';
import type { TaskFilters, TasksMode } from '../hooks/useTaskFilters';
import { PRIORITY_FILTER_OPTIONS } from '../lib/taskOptions';
import { SORT_OPTIONS } from '../lib/tasks';

const MODE_TABS: TabItem<TasksMode>[] = [
    { value: 'board', label: 'Доска' },
    { value: 'table', label: 'Таблица' },
];

interface ToolbarProps {
    filters: TaskFilters;
    assigneeOptions: Option[];
    onCreate: () => void;
}

export const Toolbar = ({ filters, assigneeOptions, onCreate }: ToolbarProps) => (
    <div className="flex flex-wrap items-center gap-2 border-b p-4">
        <Tabs<TasksMode>
            items={MODE_TABS}
            value={filters.mode}
            onValueChange={filters.setMode}
        />
        <Input
            className="max-w-56"
            placeholder="Поиск задач…"
            value={filters.search}
            onChange={(event) => filters.setSearch(event.target.value)}
        />
        <Select
            size="sm"
            value={filters.priority}
            onValueChange={filters.setPriority}
            options={PRIORITY_FILTER_OPTIONS}
        />
        <Select
            size="sm"
            value={filters.assignee}
            onValueChange={filters.setAssignee}
            options={[{ value: 'all', label: 'Все исполнители' }, ...assigneeOptions]}
        />
        <Select
            size="sm"
            value={filters.sort}
            onValueChange={filters.setSort}
            options={SORT_OPTIONS}
        />
        <Button
            size="sm"
            className="ml-auto"
            onClick={onCreate}
        >
            Новая задача
        </Button>
    </div>
);
