'use client';

import type { ReactNode } from 'react';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from '@/ui/Base/Dropdown/primitives';

interface DropdownProps {
    trigger: ReactNode;
    children: ReactNode;
    align?: 'start' | 'end' | 'center';
    className?: string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

const DropdownBase = ({
    trigger,
    children,
    align = 'start',
    className,
    open,
    onOpenChange,
}: DropdownProps) => {
    return (
        <DropdownMenu
            open={open}
            onOpenChange={onOpenChange}
        >
            <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
            <DropdownMenuContent
                align={align}
                className={className}
            >
                {children}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export const Dropdown = Object.assign(DropdownBase, {
    Item: DropdownMenuItem,
    Separator: DropdownMenuSeparator,
    Group: DropdownMenuGroup,
    Label: DropdownMenuLabel,
    CheckboxItem: DropdownMenuCheckboxItem,
    RadioGroup: DropdownMenuRadioGroup,
    RadioItem: DropdownMenuRadioItem,
    Shortcut: DropdownMenuShortcut,
    Sub: DropdownMenuSub,
    SubTrigger: DropdownMenuSubTrigger,
    SubContent: DropdownMenuSubContent,
});

export * from './primitives';
