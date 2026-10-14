const DRAFT_PREFIX = 'chat-draft:';

const listeners = new Set<() => void>();

let version = 0;

function storageKey(key: string): string {
    return `${DRAFT_PREFIX}${key}`;
}

export function readDraft(key: string): string {
    try {
        return window.localStorage.getItem(storageKey(key)) ?? '';
    } catch {
        return '';
    }
}

export function writeDraft(key: string, value: string): void {
    try {
        if (value.trim()) window.localStorage.setItem(storageKey(key), value);
        else window.localStorage.removeItem(storageKey(key));
    } catch {
        return;
    }

    version += 1;

    for (const listener of listeners) listener();
}

export function subscribeDrafts(listener: () => void): () => void {
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
}

export function draftsVersion(): number {
    return version;
}

export function serverDraftsVersion(): number {
    return 0;
}
