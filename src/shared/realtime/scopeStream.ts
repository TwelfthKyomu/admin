import 'server-only';

import { type ScopeEvent, subscribeToScope } from './scopeEvents';

const HEARTBEAT_MS = 25_000;

const serializeEvent = (scopeId: string, event: ScopeEvent): string => {
    return `event: ${event.type}\ndata: ${JSON.stringify({ ...event, scopeId })}\n\n`;
};

export const createScopeStream = (
    scopeIds: string[],
    signal: AbortSignal,
): ReadableStream => {
    const encoder = new TextEncoder();
    const unsubscribers: Array<() => void> = [];
    let heartbeat: ReturnType<typeof setInterval> | undefined;
    let stop: (() => void) | undefined;
    let closed = false;

    const cleanup = () => {
        if (closed) return;

        closed = true;
        clearInterval(heartbeat);

        for (const off of unsubscribers) off();

        stop?.();
    };

    signal.addEventListener('abort', cleanup, { once: true });

    const stream = new ReadableStream({
        start(controller) {
            stop = () => {
                try {
                    controller.close();
                } catch {}
            };

            const send = (chunk: string) => {
                if (closed) return;

                try {
                    controller.enqueue(encoder.encode(chunk));
                } catch {
                    cleanup();
                }
            };

            send('retry: 3000\n\n');

            for (const scopeId of scopeIds) {
                unsubscribers.push(
                    subscribeToScope(scopeId, (event) =>
                        send(serializeEvent(scopeId, event)),
                    ),
                );
            }

            heartbeat = setInterval(() => send(': ping\n\n'), HEARTBEAT_MS);
        },
        cancel: cleanup,
    });

    return stream;
};
