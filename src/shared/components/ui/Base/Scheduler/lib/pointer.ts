export const suppressNextClick = () => {
    const stop = (event: MouseEvent) => {
        event.stopPropagation();
        event.preventDefault();
    };

    window.addEventListener('click', stop, { capture: true, once: true });

    window.setTimeout(
        () => window.removeEventListener('click', stop, { capture: true }),
        0,
    );
};

export const trackMouse = (
    onMove: (event: MouseEvent) => void,
    onEnd: (commit: boolean) => void,
) => {
    const move = (event: MouseEvent) =>
        event.buttons === 0 ? end(true) : onMove(event);

    const up = () => end(true);

    const key = (event: KeyboardEvent) => {
        if (event.key === 'Escape') end(false);
    };

    const end = (commit: boolean) => {
        window.removeEventListener('mousemove', move);
        window.removeEventListener('mouseup', up);
        window.removeEventListener('keydown', key);
        onEnd(commit);
    };

    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    window.addEventListener('keydown', key);
};

export const columnAt = (event: MouseEvent): string | undefined => {
    return (
        document
            .elementsFromPoint(event.clientX, event.clientY)
            .find((element) => element.hasAttribute('data-col'))
            ?.getAttribute('data-col') ?? undefined
    );
};
