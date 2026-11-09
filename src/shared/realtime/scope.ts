'use client';

import { useEffect, useRef } from 'react';
import { useStaticData } from '@/app/providers/StaticDataProvider';
import { toast } from '@/shared/lib/toast';
import { useQueryClient } from '@tanstack/react-query';

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

export function startLocalMutation(): void {
    localMutations.inFlight += 1;
}

export function settleLocalMutation(): void {
    localMutations.inFlight = Math.max(0, localMutations.inFlight - 1);
    localMutations.settledAt = Date.now();
}

function isLocalEcho(event: ScopeSyncEvent, userId: string): boolean {
    if (event.userId !== userId) return false;

    return (
        localMutations.inFlight > 0 ||
        Date.now() - localMutations.settledAt < LOCAL_ECHO_MS
    );
}

export function broadcastTyping(scopeId: string): void {
    if (!scopeId) return;

    void fetch('/api/realtime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scopeId }),
        keepalive: true,
    }).catch(() => {});
}

function parse<T>(event: MessageEvent<string>): T | undefined {
    try {
        return JSON.parse(event.data) as T;
    } catch {
        return undefined;
    }
}

export function useRealtimeSync(
    scopeIds: ReadonlyArray<string | undefined>,
    options: { onTyping?: (event: ScopeTypingEvent) => void } = {},
): void {
    const queryClient = useQueryClient();
    const { user } = useStaticData();
    const optionsRef = useRef(options);

    useEffect(() => {
        optionsRef.current = options;
    });

    const key = scopeIds.filter(Boolean).sort().join('|');

    useEffect(() => {
        const ids = key ? key.split('|') : [];

        if (ids.length === 0) return;

        const query = ids
            .map((id) => `scope=${encodeURIComponent(id)}`)
            .join('&');

        const source = new EventSource(`/api/realtime?${query}`);

        const handleSync = (event: MessageEvent<string>) => {
            const payload = parse<ScopeSyncEvent>(event);

            if (!payload) return;

            if (payload.notice) toast.info(payload.notice);
            if (isLocalEcho(payload, user.id)) return;

            queryClient.invalidateQueries({
                predicate: (query) => query.queryKey.includes(payload.scopeId),
            });
        };

        const handleTyping = (event: MessageEvent<string>) => {
            const payload = parse<ScopeTypingEvent>(event);

            if (payload) optionsRef.current.onTyping?.(payload);
        };

        source.addEventListener('sync', handleSync);
        source.addEventListener('typing', handleTyping);
        source.onerror = () => {};

        return () => {
            source.removeEventListener('sync', handleSync);
            source.removeEventListener('typing', handleTyping);
            source.close();
        };
    }, [key, queryClient, user.id]);
}
