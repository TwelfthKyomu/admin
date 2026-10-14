'use client';

import { QueryBoundary } from '@/shared/components/common';
import { Table } from '@/ui/Base';
import { getColumns } from './components/Column';
import { useUsersPage } from './hooks/useUsersPage';

export const UsersPage = () => {
    const data = useUsersPage();
    const columns = getColumns(data);

    return (
        <QueryBoundary
            query={data.query}
            errorTitle="Не удалось загрузить пользователей"
        >
            {(members) => (
                <Table
                    columns={columns}
                    data={members}
                    isLoading={data.query.isLoading}
                    getRowId={(member) => member.id}
                />
            )}
        </QueryBoundary>
    );
};
