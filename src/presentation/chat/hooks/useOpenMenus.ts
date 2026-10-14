'use client';

import { useState } from 'react';

export function useOpenMenus() {
    const [openMenus, setOpenMenus] = useState(0);

    return {
        anyOpen: openMenus > 0,
        track: (open: boolean) =>
            setOpenMenus((count) => Math.max(0, count + (open ? 1 : -1))),
    };
}
