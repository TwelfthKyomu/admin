'use client';

import type { ReactNode } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import { EmptyState } from '../EmptyState';
import { ErrorState } from '../ErrorState';
import { PageLoader } from '../PageLoader';

interface QueryBoundaryProps<TData> {
    query: Pick<UseQueryResult<TData>, 'data' | 'isLoading' | 'isError' | 'refetch'>;
    children: (data: NonNullable<TData>) => ReactNode;
    isEmpty?: (data: TData) => boolean;
    loading?: ReactNode;
    empty?: ReactNode;
    errorTitle?: string;
}

export const QueryBoundary = <TData,>({
    query,
    children,
    isEmpty,
    loading,
    empty,
    errorTitle,
}: QueryBoundaryProps<TData>) => {
    if (query.isError) {
        return (
            <ErrorState
                title={errorTitle}
                onRetry={() => void query.refetch()}
            />
        );
    }

    if (query.isLoading || query.data === undefined) {
        return loading ?? <PageLoader />;
    }

    if (isEmpty?.(query.data) || query.data === null) {
        return empty ?? <EmptyState title="Пока пусто" />;
    }

    return children(query.data);
};
