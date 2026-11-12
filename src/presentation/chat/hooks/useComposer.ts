'use client';

import { useRef } from 'react';
import type { ChatMessageView } from '@/contexts/chat';

export const useComposer = ({
    onChange,
    onTyping,
    replyTo,
    onCancelReply,
    editing,
    onCancelEdit,
}: {
    onChange: (value: string) => void;
    onTyping?: () => void;
    replyTo?: ChatMessageView;
    onCancelReply: () => void;
    editing?: ChatMessageView;
    onCancelEdit: () => void;
}) => {
    const fileInput = useRef<HTMLInputElement>(null);

    const handleChange = (next: string) => {
        onChange(next);

        if (next.length > 0) onTyping?.();
    };

    let cancel: (() => void) | undefined;

    if (editing) cancel = onCancelEdit;
    else if (replyTo) cancel = onCancelReply;

    return { fileInput, handleChange, cancel };
};
