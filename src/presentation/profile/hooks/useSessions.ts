'use client';

import { authClient } from '@/shared/lib/auth-client';
import { nullToOptional } from '@/shared/lib/optional';
import { toast } from '@/shared/lib/toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { showSessionError } from '../lib/sessionErrors';

const SESSIONS_KEY = ['profile', 'sessions'] as const;
const THROW = { fetchOptions: { throw: true } } as const;

export const useSessions = () => {
    const queryClient = useQueryClient();
    const { data: current } = authClient.useSession();

    const query = useQuery({
        queryKey: SESSIONS_KEY,
        queryFn: () => authClient.listSessions(THROW),
        select: (sessions) =>
            sessions
                .filter((session) => session.token !== current?.session.token)
                .map(nullToOptional),
    });

    const onSettled = () =>
        queryClient.invalidateQueries({ queryKey: SESSIONS_KEY });

    const revoke = useMutation({
        mutationFn: (token: string) =>
            authClient.revokeSession({ token, ...THROW }),
        onSuccess: () => toast.success('Сеанс завершён'),
        onError: showSessionError,
        onSettled,
    });

    const revokeOthers = useMutation({
        mutationFn: () => authClient.revokeOtherSessions(THROW),
        onSuccess: () => toast.success('Остальные сеансы завершены'),
        onError: showSessionError,
        onSettled,
    });

    return { query, revoke, revokeOthers };
};
