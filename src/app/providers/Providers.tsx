'use client';

import type { PropsWithChildren } from 'react';
import { ErrorBoundary } from '@/shared/components/feedback/ErrorBoundary';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { QueryProvider } from './QueryProvider';

export const Providers = ({ children }: PropsWithChildren) => (
    <NuqsAdapter>
        <QueryProvider>
            <ErrorBoundary>{children}</ErrorBoundary>
        </QueryProvider>
    </NuqsAdapter>
);
