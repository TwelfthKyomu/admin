'use client';

import { Suspense, useSyncExternalStore } from 'react';
import { modalStore } from '@/shared/store/modal';

export const ModalRoot = () => {
    const modals = useSyncExternalStore(
        modalStore.subscribe,
        modalStore.snapshot,
        modalStore.snapshot,
    );

    return (
        <>
            {modals.map((m) => (
                <Suspense
                    key={m.id}
                    fallback={null}
                >
                    <div>{m.render()}</div>
                </Suspense>
            ))}
        </>
    );
};
