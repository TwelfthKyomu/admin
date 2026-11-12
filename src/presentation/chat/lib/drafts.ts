const DRAFT_PREFIX = 'chat-draft:';

const listeners = new Set<() => void>();

let version = 0;

const storageKey = (key: string): string => {
    return `${DRAFT_PREFIX}${key}`;
};

export const readDraft = (key: string): string => {
    try {
        return window.localStorage.getItem(storageKey(key)) ?? '';
    } catch {
        return '';
    }
};

export const writeDraft = (key: string, value: string): void => {
    try {
        if (value.trim()) window.localStorage.setItem(storageKey(key), value);
        else window.localStorage.removeItem(storageKey(key));
    } catch {
        return;
    }

    version += 1;

    for (const listener of listeners) listener();
};

export const subscribeDrafts = (listener: () => void): (() => void) => {
    const onStorage = (event: StorageEvent) => {
        if (!event.key?.startsWith(DRAFT_PREFIX)) return;

        version += 1;
        listener();
    };

    listeners.add(listener);
    window.addEventListener('storage', onStorage);

    return () => {
        listeners.delete(listener);
        window.removeEventListener('storage', onStorage);
    };
};

export const draftsVersion = (): number => {
    return version;
};

export const serverDraftsVersion = (): number => {
    return 0;
};
