'use client';

import { type PropsWithChildren, useState } from 'react';
import { createQueryClient } from '@/shared/lib/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';

export const QueryProvider = ({ children }: PropsWithChildren) => {
    const [queryClient] = useState(createQueryClient);

    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};
