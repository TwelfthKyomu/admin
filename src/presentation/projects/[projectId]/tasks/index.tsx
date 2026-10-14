'use client';

import { QueryBoundary } from '@/shared/components/common';
import { Table } from '@/ui/Base';
import { TaskBoard } from './components/Board';
import { COLUMNS } from './components/Column';
import { Toolbar } from './components/Toolbar';
import { useTaskActions } from './hooks/useTaskActions';
import { useTaskFilters } from './hooks/useTaskFilters';
import { useTasksPage } from './hooks/useTasksPage';

export const TasksPage = () => {
    const filters = useTaskFilters();
    const { query, tasks, projectKey, memberNames, assigneeOptions } = useTasksPage(filters.values);
    const actions = useTaskActions(assigneeOptions);

    return (
        <>
            <Toolbar
                filters={filters}
                assigneeOptions={assigneeOptions}
                onCreate={actions.onCreate}
            />
            <div className="min-h-0 flex-1 overflow-auto p-4">
                <QueryBoundary
                    query={query}
                    errorTitle="Не удалось загрузить задачи"
                >
                    {() =>
                        filters.mode === 'board' ? (
                            <TaskBoard
                                tasks={tasks}
                                projectKey={projectKey}
                                memberNames={memberNames}
                                actions={actions}
                            />
                        ) : (
                            <Table
                                columns={COLUMNS({ projectKey, memberNames, actions })}
                                data={tasks}
                                emptyMessage="Задачи не найдены."
                                getRowId={(task) => task.id}
                            />
                        )
                    }
                </QueryBoundary>
            </div>
        </>
    );
};
