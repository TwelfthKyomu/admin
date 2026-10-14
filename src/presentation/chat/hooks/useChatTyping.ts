'use client';

import { useEffect, useRef, useState } from 'react';
import {
    broadcastTyping,
    type ScopeTypingEvent,
} from '@/shared/realtime/scope';

export interface ChatTypingUser {
    userId: string;
    name: string;
}

const TICK_MS = 1_000;
const TYPING_TTL_MS = 6_000;
const TYPING_PING_MS = 3_000;

function sameUsers(a: ChatTypingUser[], b: ChatTypingUser[]) {
    return (
        a.length === b.length &&
        a.every((user, index) => user.userId === b[index]?.userId)
    );
}

export function useChatTyping(scopeId: string, selfUserId: string) {
    const [typists, setTypists] = useState<ChatTypingUser[]>([]);
    const seenAt = useRef(new Map<string, { name: string; at: number }>());
    const lastPingAt = useRef(0);

    const refresh = () => {
        const now = Date.now();
        const active: ChatTypingUser[] = [];

        for (const [userId, entry] of seenAt.current) {
            if (now - entry.at > TYPING_TTL_MS) {
                seenAt.current.delete(userId);
                continue;
            }

            active.push({ userId, name: entry.name });
        }

        setTypists((previous) =>
            sameUsers(previous, active) ? previous : active,
        );
    };

    const handleTyping = (event: ScopeTypingEvent) => {
        if (event.scopeId !== scopeId || event.userId === selfUserId) return;

        seenAt.current.set(event.userId, { name: event.name, at: Date.now() });
        refresh();
    };

    useEffect(() => {
        seenAt.current.clear();
        setTypists([]);
    }, [scopeId]);

    useEffect(() => {
        if (typists.length === 0) return;

        const timer = setInterval(refresh, TICK_MS);

        return () => clearInterval(timer);
    }, [typists.length, refresh]);

    const notifyTyping = () => {
        const now = Date.now();

        if (now - lastPingAt.current < TYPING_PING_MS) return;

        lastPingAt.current = now;
        broadcastTyping(scopeId);
    };

    return { typists, handleTyping, notifyTyping };
}
