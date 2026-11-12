import type { QueryClient, QueryKey } from '@tanstack/react-query';

export type QuerySnapshot = [QueryKey, unknown][];

export const snapshotQueries = async (
    queryClient: QueryClient,
    keys: QueryKey[],
): Promise<QuerySnapshot> => {
    await Promise.all(
        keys.map((queryKey) => queryClient.cancelQueries({ queryKey })),
    );

    return keys.flatMap((queryKey) => queryClient.getQueriesData({ queryKey }));
};

export const restoreQueries = (
    queryClient: QueryClient,
    snapshot: QuerySnapshot = [],
): void => {
    for (const [key, data] of snapshot) queryClient.setQueryData(key, data);
};
