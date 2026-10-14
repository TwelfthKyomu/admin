'use client';

import type { ReactNode } from 'react';
import {
    Popover as BasePopover,
    PopoverContent,
    PopoverDescription,
    PopoverHeader,
    PopoverTitle,
    PopoverTrigger,
} from './primitives';

interface PopoverProps {
    trigger: ReactNode;
    title?: ReactNode;
    description?: ReactNode;
    children?: ReactNode;
    className?: string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export const Popover = ({
    trigger,
    title,
    description,
    children,
    className,
    open,
    onOpenChange,
}: PopoverProps) => {
    return (
        <BasePopover
            open={open}
            onOpenChange={onOpenChange}
        >
            <PopoverTrigger asChild>{trigger}</PopoverTrigger>
            <PopoverContent className={className}>
                {(title || description) && (
                    <PopoverHeader>
                        {title && <PopoverTitle>{title}</PopoverTitle>}
                        {description && <PopoverDescription>{description}</PopoverDescription>}
                    </PopoverHeader>
                )}
                {children}
            </PopoverContent>
        </BasePopover>
    );
};
