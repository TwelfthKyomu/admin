interface ShortcutEvent {
    key: string;
    code: string;
    ctrlKey: boolean;
    metaKey: boolean;
}

export function isLetterShortcut(
    event: ShortcutEvent,
    letter: string,
): boolean {
    if (!(event.metaKey || event.ctrlKey)) return false;

    return (
        event.code === `Key${letter.toUpperCase()}` ||
        event.key.toLowerCase() === letter
    );
}
