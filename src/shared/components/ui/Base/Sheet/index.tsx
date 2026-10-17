'use client';

import { type ReactNode, useState } from 'react';
import { cn } from '@/shared/lib/utils';
import {
    Sheet as BaseSheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/ui/Base/Sheet/primitives';

interface FormSheetProps {
    onClose?: () => void;
    canClose?: () => Promise<boolean>;
    className?: string;
    showCloseButton?: boolean;
    side?: 'top' | 'right' | 'bottom' | 'left';
    title?: ReactNode;
    description?: ReactNode;
    busy?: boolean;
    children: ReactNode | ((close: () => void) => ReactNode);
}

const SheetBase = ({
    onClose,
    canClose,
    className,
    showCloseButton = true,
    side = 'right',
    title,
    description,
    busy = false,
    children,
}: FormSheetProps) => {
    const [open, setOpen] = useState(true);

    const close = () => {
        setOpen(false);
        onClose?.();
    };

    return (
        <BaseSheet
            open={open}
            onOpenChange={async (next) => {
                if (next || busy) return;
                if (!canClose || (await canClose())) close();
            }}
        >
            <SheetContent
                side={side}
                showCloseButton={showCloseButton && !busy}
                className={cn('w-full overflow-y-auto sm:max-w-lg px-4 pt-4', className)}
            >
                {(title || description) && (
                    <SheetHeader>
                        {title && <SheetTitle>{title}</SheetTitle>}
                        {description && <SheetDescription>{description}</SheetDescription>}
                    </SheetHeader>
                )}
                {typeof children === 'function' ? children(close) : children}
            </SheetContent>
        </BaseSheet>
    );
};

export const Sheet = Object.assign(SheetBase, {
    Header: SheetHeader,
    Title: SheetTitle,
    Description: SheetDescription,
    Footer: SheetFooter,
    Close: SheetClose,
});
