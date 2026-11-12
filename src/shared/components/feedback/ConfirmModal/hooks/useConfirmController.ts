'use client';

import { useState } from 'react';

export const useConfirmController = (onResolve: (result: boolean) => void) => {
    const [open, setOpen] = useState(true);
    const [pending, setPending] = useState(false);

    const close = (result: boolean) => {
        setOpen(false);

        setTimeout(() => onResolve(result), 150);
    };

    return { open, pending, setPending, close };
};
