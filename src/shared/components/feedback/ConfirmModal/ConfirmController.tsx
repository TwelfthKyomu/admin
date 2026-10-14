'use client';

import { type ReactNode, useState } from 'react';
import { ConfirmModal } from '@/shared/components/feedback';

export interface ConfirmOptions {
    title: string;
    description?: ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    tone?: 'default' | 'destructive';
    onConfirm?: () => void | Promise<void>;
}

interface ConfirmControllerProps {
    opts: ConfirmOptions;
    onResolve: (result: boolean) => void;
}

export const ConfirmController = ({ opts, onResolve }: ConfirmControllerProps) => {
    const [open, setOpen] = useState(true);
    const [pending, setPending] = useState(false);

    const close = (result: boolean) => {
        setOpen(false);

        setTimeout(() => onResolve(result), 150);
    };

    return (
        <ConfirmModal
            open={open}
            onOpenChange={(next) => {
                if (!next && !pending) close(false);
            }}
            title={opts.title}
            description={opts.description}
            confirmLabel={opts.confirmLabel}
            cancelLabel={opts.cancelLabel}
            tone={opts.tone}
            isPending={pending}
            onConfirm={async () => {
                try {
                    setPending(true);
                    await opts.onConfirm?.();
                    close(true);
                } finally {
                    setPending(false);
                }
            }}
        />
    );
};
