'use client';

import { type PropsWithChildren, useState } from 'react';
import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';

function createQueryClient() {
    const queryClient: QueryClient = new QueryClient({
        mutationCache: new MutationCache({
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
}

export const QueryProvider = ({ children }: PropsWithChildren) => {
    const [queryClient] = useState(createQueryClient);

    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};
