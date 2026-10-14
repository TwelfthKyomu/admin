import 'server-only';

export type ScopeEvent =
    | { type: 'sync'; origin?: string }
    | {
          type: 'typing';
          userId: string;
          name: string;
      };

type Listener = (event: ScopeEvent) => void;

const globalForRealtime = globalThis as unknown as {
    __scopeListeners?: Map<string, Set<Listener>>;
};

if (!globalForRealtime.__scopeListeners) {
    globalForRealtime.__scopeListeners = new Map<string, Set<Listener>>();
}

const listeners = globalForRealtime.__scopeListeners;

export function publishScopeEvent(
    scopeId: string,
    event: ScopeEvent = { type: 'sync' },
): void {
    const set = listeners.get(scopeId);

    if (!set) return;

    for (const notify of set) notify(event);
}

export function subscribeToScope(
    scopeId: string,
    listener: Listener,
): () => void {
    let set = listeners.get(scopeId);

    if (!set) {
        set = new Set();
        listeners.set(scopeId, set);
    }

    set.add(listener);

    return () => {
        const current = listeners.get(scopeId);

        if (!current) return;

        current.delete(listener);

        if (current.size === 0) listeners.delete(scopeId);
    };
}
