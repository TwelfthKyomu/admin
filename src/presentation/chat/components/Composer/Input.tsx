'use client';

import { TEXT_MAX } from '@/shared/constants/default';
import { cn } from '@/shared/lib/utils';
import { InputGroupTextarea } from '@/ui/Base';
import { useMessageInput } from '../../hooks/useMessageInput';

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
    const { handlePaste, handleKeyDown } = useMessageInput({
        value,
        onSubmit,
        onCancel,
        onArrowUpOnEmpty,
        onPasteFiles,
    });

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
