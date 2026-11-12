'use client';

import type { ReactNode } from 'react';
import { ConfirmModal } from '@/shared/components/feedback';
import { useConfirmController } from './hooks/useConfirmController';

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
    const { open, pending, setPending, close } = useConfirmController(onResolve);

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
