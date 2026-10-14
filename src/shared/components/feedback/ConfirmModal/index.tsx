'use client';

import type { CSSProperties, ReactNode } from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/ui/Base';

type ConfirmTone = 'default' | 'destructive';

interface ConfirmModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    tone?: ConfirmTone;
    isPending?: boolean;
    contentClassName?: string;
    contentStyle?: CSSProperties;
    onConfirm: () => void | Promise<void>;
}

export const ConfirmModal = ({
    open,
    onOpenChange,
    title,
    description,
    confirmLabel = 'Подтвердить',
    cancelLabel = 'Отмена',
    tone = 'default',
    isPending = false,
    contentClassName = 'max-w-[calc(100%-2rem)] sm:max-w-sm',
    contentStyle,
    onConfirm,
}: ConfirmModalProps) => (
    <AlertDialog
        open={open}
        onOpenChange={onOpenChange}
    >
        <AlertDialogContent
            size="sm"
            className={contentClassName}
            style={contentStyle}
        >
            <AlertDialogHeader>
                <AlertDialogTitle>{title}</AlertDialogTitle>
                {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel disabled={isPending}>{cancelLabel}</AlertDialogCancel>
                <AlertDialogAction
                    variant={tone === 'destructive' ? 'destructive' : 'default'}
                    disabled={isPending}
                    onClick={(event) => {
                        event.preventDefault();
                        void onConfirm();
                    }}
                >
                    {confirmLabel}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
);
