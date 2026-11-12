'use client';

import type { ComponentProps, ReactNode } from 'react';
import { useDismissible } from '@/shared/hooks/useDismissible';
import { DialogClose, DialogFooter } from '@/ui/Base';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/ui/Base/Modal/primitives';

export * from './primitives';

interface ModalProps extends Omit<ComponentProps<typeof Dialog>, 'children'> {
    onClose?: () => void;
    canClose?: () => Promise<boolean>;
    className?: string;
    showCloseButton?: boolean;
    title?: ReactNode;
    description?: ReactNode;
    busy?: boolean;
    children: ReactNode | ((close: () => void) => ReactNode);
}

const ModalBase = ({
    onClose,
    canClose,
    className,
    showCloseButton = true,
    title,
    description,
    busy = false,
    children,
}: ModalProps) => {
    const { open, close, onOpenChange } = useDismissible({ onClose, canClose, busy });

    return (
        <Dialog
            open={open}
            onOpenChange={onOpenChange}
        >
            <DialogContent
                className={className}
                showCloseButton={showCloseButton && !busy}
            >
                {(title || description) && (
                    <DialogHeader>
                        {title && <DialogTitle>{title}</DialogTitle>}
                        {description && <DialogDescription>{description}</DialogDescription>}
                    </DialogHeader>
                )}
                {typeof children === 'function' ? children(close) : children}
            </DialogContent>
        </Dialog>
    );
};

export const Modal = Object.assign(ModalBase, {
    Header: DialogHeader,
    Title: DialogTitle,
    Description: DialogDescription,
    Footer: DialogFooter,
    CloseButton: DialogClose,
});
