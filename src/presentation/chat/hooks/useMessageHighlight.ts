'use client';

import { useEffect, useState } from 'react';
import { useMessageScroller } from '@/ui/Base';

const HIGHLIGHT_MS = 1_600;

export function useMessageHighlight() {
    const { scrollToMessage } = useMessageScroller();
    const [highlightId, setHighlightId] = useState<string>();

    useEffect(() => {
        if (!highlightId) return;

        const timer = setTimeout(() => setHighlightId(undefined), HIGHLIGHT_MS);

        return () => clearTimeout(timer);
    }, [highlightId]);

    const jumpTo = (messageId: string) => {
        const found = scrollToMessage(messageId, {
            align: 'center',
            behavior: 'smooth',
        });

        if (found) setHighlightId(messageId);

        return found;
    };

    return { highlightId, jumpTo };
}
