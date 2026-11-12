'use client';

import { type Dispatch, type SetStateAction, useEffect } from 'react';
import { isLetterShortcut } from '@/shared/lib/hotkey';

export const useHotkeyToggle = (setOpen: Dispatch<SetStateAction<boolean>>) => {
    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (!isLetterShortcut(event, 'k')) return;

            event.preventDefault();
            setOpen((open) => !open);
        };

        window.addEventListener('keydown', onKeyDown);

        return () => window.removeEventListener('keydown', onKeyDown);
    }, [setOpen]);
};
