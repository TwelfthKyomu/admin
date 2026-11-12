'use client';

import type { ClipboardEvent, KeyboardEvent } from 'react';

export const useMessageInput = ({
    value,
    onSubmit,
    onCancel,
    onArrowUpOnEmpty,
    onPasteFiles,
}: {
    value: string;
    onSubmit: () => void;
    onCancel?: () => void;
    onArrowUpOnEmpty?: () => void;
    onPasteFiles?: (files: File[]) => void;
}) => {
    const handlePaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
        const files = [...event.clipboardData.files];

        if (files.length === 0 || !onPasteFiles) return;

        event.preventDefault();
        onPasteFiles(files);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            onSubmit();

            return;
        }

        if (event.key === 'Escape' && onCancel) {
            event.preventDefault();
            onCancel();

            return;
        }

        if (event.key === 'ArrowUp' && value.length === 0 && onArrowUpOnEmpty) {
            event.preventDefault();
            onArrowUpOnEmpty();
        }
    };

    return { handlePaste, handleKeyDown };
};
