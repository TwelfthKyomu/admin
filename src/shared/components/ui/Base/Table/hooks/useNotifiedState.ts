'use no memo';

import { useState } from 'react';
import type { Updater } from '@tanstack/react-table';

export const useNotifiedState = <T>(initial: T, notify?: (next: T) => void) => {
    const [state, setState] = useState<T>(initial);

    const onChange = (updater: Updater<T>) => {
        const next =
            typeof updater === 'function'
                ? (updater as (old: T) => T)(state)
                : updater;

        setState(next);
        notify?.(next);
    };

    return [state, onChange, setState] as const;
};
