import { cache } from 'react';
import { auth } from '@/shared/lib/auth';
import { headers } from 'next/headers';

export type ServerSession = NonNullable<
    Awaited<ReturnType<typeof auth.api.getSession>>
>;

export const getServerSession = cache(
    async (): Promise<ServerSession | null> =>
        auth.api.getSession({ headers: await headers() }),
);
