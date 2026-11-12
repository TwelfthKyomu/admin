'use client';

import { useEffect, useRef } from 'react';
import { useStaticData } from '@/app/providers/StaticDataProvider';
import { useQueryClient } from '@tanstack/react-query';
import {
    realtimeUrl,
    type ScopeTypingEvent,
    syncHandler,
    typingHandler,
} from './scopeClient';

export const useRealtimeSync = (
    scopeIds: ReadonlyArray<string | undefined>,
    options: { onTyping?: (event: ScopeTypingEvent) => void } = {},
): void => {
    const queryClient = useQueryClient();
    const { user } = useStaticData();
    const optionsRef = useRef(options);

    useEffect(() => {
        optionsRef.current = options;
    });

    const key = scopeIds.filter(Boolean).sort().join('|');

    useEffect(() => {
        if (!key) return;

        const source = new EventSource(realtimeUrl(key.split('|')));
        const handleSync = syncHandler(queryClient, user.id);

        const handleTyping = typingHandler((event) =>
            optionsRef.current.onTyping?.(event),
        );

        source.addEventListener('sync', handleSync);
        source.addEventListener('typing', handleTyping);
        source.onerror = () => {};

        return () => {
            source.removeEventListener('sync', handleSync);
            source.removeEventListener('typing', handleTyping);
            source.close();
        };
    }, [key, queryClient, user.id]);
};
