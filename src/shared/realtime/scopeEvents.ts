import 'server-only';

export type ScopeEvent =
    | { type: 'sync'; userId?: string; notice?: string }
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

export const publishScopeEvent = (
    scopeId: string,
    event: ScopeEvent = { type: 'sync' },
): void => {
    const set = listeners.get(scopeId);

    if (!set) return;

    for (const notify of set) notify(event);
};

export const subscribeToScope = (
    scopeId: string,
    listener: Listener,
): (() => void) => {
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
};
