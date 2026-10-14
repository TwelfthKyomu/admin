'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export interface ScopeTypingEvent {
    scopeId: string;
    userId: string;
    name: string;
}

interface BroadcastBody {
    scopeId: string;
    typing?: boolean;
    origin?: string;
}

const TAB_ID = `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;

function post(body: BroadcastBody): void {
    if (!body.scopeId || typeof window === 'undefined') return;

    void fetch('/api/realtime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        keepalive: true,
    }).catch(() => {});
}

export function broadcastScope(scopeId: string): void {
    post({ scopeId, origin: TAB_ID });
}

export function broadcastTyping(scopeId: string): void {
    post({ scopeId, typing: true });
}

export function useRealtimeSync(
    scopeIds: ReadonlyArray<string | undefined>,
    options: { onTyping?: (event: ScopeTypingEvent) => void } = {},
): void {
    const queryClient = useQueryClient();
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

        const parse = <T>(event: MessageEvent<string>): T | undefined => {
            try {
                return JSON.parse(event.data) as T;
            } catch {
                return undefined;
            }
        };

        const handleSync = (event: MessageEvent<string>) => {
            const payload = parse<{ scopeId: string; origin?: string }>(event);

            if (!payload || payload.origin === TAB_ID) return;

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
    }, [key, queryClient]);
}
