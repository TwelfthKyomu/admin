import {
    settleLocalMutation,
    startLocalMutation,
} from '@/shared/realtime/scopeClient';
import { MutationCache, QueryClient } from '@tanstack/react-query';

export const createQueryClient = () => {
    const queryClient: QueryClient = new QueryClient({
        mutationCache: new MutationCache({
            onMutate: startLocalMutation,
            onSettled: settleLocalMutation,
            onSuccess: (_data, _variables, _result, mutation) => {
                if (mutation.meta?.invalidatesAll === false) return;

                void queryClient.invalidateQueries();
            },
        }),
        defaultOptions: {
            queries: {
                refetchOnWindowFocus: false,
                retry: 1,

                staleTime: 5 * 60 * 1000,
                gcTime: 10 * 60 * 1000,
                refetchOnReconnect: false,
            },
            mutations: {
                retry: false,
            },
        },
    });

    return queryClient;
};
