import { toast } from '@/shared/lib/toast';
import type { QueryClient } from '@tanstack/react-query';

export interface ScopeTypingEvent {
    scopeId: string;
    userId: string;
    name: string;
}

interface ScopeSyncEvent {
    scopeId: string;
    userId?: string;
    notice?: string;
}

const LOCAL_ECHO_MS = 2000;

const localMutations = { inFlight: 0, settledAt: 0 };

export const startLocalMutation = (): void => {
    localMutations.inFlight += 1;
};

export const settleLocalMutation = (): void => {
    localMutations.inFlight = Math.max(0, localMutations.inFlight - 1);
    localMutations.settledAt = Date.now();
};

const isLocalEcho = (event: ScopeSyncEvent, userId: string): boolean => {
    if (event.userId !== userId) return false;

    return (
        localMutations.inFlight > 0 ||
        Date.now() - localMutations.settledAt < LOCAL_ECHO_MS
    );
};

export const broadcastTyping = (scopeId: string): void => {
    if (!scopeId) return;

    void fetch('/api/realtime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scopeId }),
        keepalive: true,
    }).catch(() => {});
};

const parse = <T>(event: MessageEvent<string>): T | undefined => {
    try {
        return JSON.parse(event.data) as T;
    } catch {
        return undefined;
    }
};

export const realtimeUrl = (ids: string[]): string =>
    `/api/realtime?${ids.map((id) => `scope=${encodeURIComponent(id)}`).join('&')}`;

export const syncHandler =
    (queryClient: QueryClient, userId: string) =>
    (event: MessageEvent<string>): void => {
        const payload = parse<ScopeSyncEvent>(event);

        if (!payload) return;

        if (payload.notice) toast.info(payload.notice);
        if (isLocalEcho(payload, userId)) return;

        void queryClient.invalidateQueries({
            predicate: (query) => query.queryKey.includes(payload.scopeId),
        });
    };

export const typingHandler =
    (onTyping: (event: ScopeTypingEvent) => void) =>
    (event: MessageEvent<string>): void => {
        const payload = parse<ScopeTypingEvent>(event);

        if (payload) onTyping(payload);
    };
