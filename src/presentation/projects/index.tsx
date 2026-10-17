'use client';

import { CreateButton, QueryBoundary } from '@/shared/components/common';
import { Table } from '@/ui/Base';
import { COLUMNS } from './components/Column';
import { useProjectsPage } from './hooks/useProjectsPage';

export const ProjectsPage = () => {
    const { query, onCreate, onEdit, onDelete, isDeleting } = useProjectsPage();

    return (
        <QueryBoundary
            query={query}
            errorTitle="Не удалось загрузить проекты"
        >
            {(projects) => (
                <Table
                    columns={COLUMNS({ onEdit, onDelete, isDeleting })}
                    showToolbar
                    customActions={
                        <CreateButton
                            label="Проект"
                            onClick={onCreate}
                        />
                    }
                    data={projects}
                    emptyMessage="Проектов пока нет. Создайте первый."
                    getRowId={(project) => project.id}
                />
            )}
        </QueryBoundary>
    );
};
