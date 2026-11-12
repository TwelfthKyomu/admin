'use client';

import { type Dispatch, type SetStateAction, useEffect } from 'react';

export const useHotkeyToggle = (setOpen: Dispatch<SetStateAction<boolean>>) => {
    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (
                event.key.toLowerCase() !== 'k' ||
                !(event.metaKey || event.ctrlKey)
            )
                return;

            event.preventDefault();
            setOpen((open) => !open);
        };

        window.addEventListener('keydown', onKeyDown);

        return () => window.removeEventListener('keydown', onKeyDown);
    }, [setOpen]);
};
