'use client';

import { useState } from 'react';
import { copyToClipboard } from '@/shared/lib/clipboard';

export const useIssuedKeyBanner = (token: string) => {
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        if (!(await copyToClipboard(token))) return;

        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
    };

    return { copied, copy };
};
