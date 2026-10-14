'use client';

import { queryOptions, type UseQueryOptions } from '@tanstack/react-query';
import { type NullToOptional, nullToOptional } from './optional';
import { type ActionResponse, extractActionError } from './safe-action';

type ActionFn<TData> = () => Promise<ActionResponse<TData> | undefined | null>;

const DEFAULT_STALE_TIME = 30_000;

async function unwrap<TData>(actionFn: ActionFn<TData>): Promise<TData | null> {
    const response = await actionFn();
    const error = extractActionError(response);

    if (error) throw new Error(error);

    return response?.data ?? null;
}

interface ItemQueryOptions {
    enabled?: boolean;
    staleTime?: number;
}

export function itemQuery<TItem>(
    queryKey: readonly unknown[],
    actionFn: ActionFn<TItem>,
    { enabled = true, staleTime = DEFAULT_STALE_TIME }: ItemQueryOptions = {},
) {
    return queryOptions({
        queryKey,
        queryFn: async () => nullToOptional(await unwrap(actionFn)),
        enabled,
        staleTime,
    });
}

export function listQuery<TItem>(
    queryKey: readonly unknown[],
    actionFn: ActionFn<TItem[]>,
    options: Partial<UseQueryOptions<NullToOptional<TItem>[], Error>> = {},
) {
    return queryOptions<NullToOptional<TItem>[]>({
        queryKey,
        queryFn: async () =>
            ((await unwrap(actionFn)) ?? []).map(nullToOptional),
        staleTime: DEFAULT_STALE_TIME,
        ...options,
    });
}
