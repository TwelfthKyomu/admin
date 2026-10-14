import { createContext, type ReactNode, useContext } from 'react';
import { modalStore } from '@/shared/store/modal';
import { ConfirmController, type ConfirmOptions } from '@/feedback/ConfirmModal/ConfirmController';
import { extractActionError } from '../safe-action';
import { toast } from '../toast';

export type { ConfirmOptions };

const ModalCloseContext = createContext<(() => void) | null>(null);

export function useModalClose(): () => void {
    const close = useContext(ModalCloseContext);

    if (!close) {
        throw new Error(
            'useModalClose() доступен только внутри модалки, открытой через modal.open()',
        );
    }

    return close;
}

export const modal = {
    confirm(opts: ConfirmOptions): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            const id = modalStore.push({
                render: () => (
                    <ConfirmController
                        opts={opts}
                        onResolve={(result) => {
                            modalStore.remove(id);
                            resolve(result);
                        }}
                    />
                ),
            });
        });
    },

    open<TResult = void>(
        render: ReactNode | ((close: (result?: TResult) => void) => ReactNode),
    ): Promise<TResult | undefined> {
        return new Promise<TResult | undefined>((resolve) => {
            const id = modalStore.push({
                render: () => {
                    const close = (result?: TResult) => {
                        modalStore.remove(id);
                        resolve(result);
                    };

                    return (
                        <ModalCloseContext.Provider value={() => close()}>
                            {typeof render === 'function' ? render(close) : render}
                        </ModalCloseContext.Provider>
                    );
                },
            });
        });
    },

    closeAll() {
        modalStore.clear();
    },
};

export async function confirmDestructive(opts: {
    title: string;
    description: ReactNode;
    confirmLabel?: string;
    success?: string;
    onConfirm: () => Promise<unknown>;
}): Promise<boolean> {
    let confirmed = false;

    await modal.confirm({
        title: opts.title,
        description: opts.description,
        confirmLabel: opts.confirmLabel ?? 'Удалить',
        tone: 'destructive',
        onConfirm: async () => {
            const error = extractActionError(await opts.onConfirm());

            if (error) {
                toast.error(error);

                return;
            }

            confirmed = true;
        },
    });

    if (confirmed && opts.success) toast.success(opts.success);

    return confirmed;
}
