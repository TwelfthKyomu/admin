'use client';

import { itemQuery } from '@/shared/lib/queries';
import { useQuery } from '@tanstack/react-query';
import { searchAction } from './Search.actions';
import { SEARCH_MIN_LENGTH } from './Search.schema';

export function useGlobalSearch(query: string) {
    const trimmed = query.trim();

    return useQuery(
        itemQuery(['search', trimmed], () => searchAction({ query: trimmed }), {
            enabled: trimmed.length >= SEARCH_MIN_LENGTH,
            staleTime: 15_000,
        }),
    );
}
