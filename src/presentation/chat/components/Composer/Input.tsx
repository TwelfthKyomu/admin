'use client';

import type { ClipboardEvent, KeyboardEvent } from 'react';
import { TEXT_MAX } from '@/shared/constants/default';
import { cn } from '@/shared/lib/utils';
import { InputGroupTextarea } from '@/ui/Base';

interface MessageInputProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit: () => void;
    onCancel?: () => void;
    onArrowUpOnEmpty?: () => void;
    onPasteFiles?: (files: File[]) => void;
    placeholder?: string;
    autoFocus?: boolean;
    label: string;
    className?: string;
}

export const MessageInput = ({
    value,
    onChange,
    onSubmit,
    onCancel,
    onArrowUpOnEmpty,
    onPasteFiles,
    placeholder,
    autoFocus,
    label,
    className,
}: MessageInputProps) => {
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

    return (
        <InputGroupTextarea
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={placeholder}
            maxLength={TEXT_MAX}
            rows={1}
            autoFocus={autoFocus}
            aria-label={label}
            className={cn(
                'field-sizing-content min-h-[30px] max-h-40 px-0 py-[5px] text-[13.5px] leading-normal md:text-[13.5px]',
                className,
            )}
        />
    );
};
