import type { ReactNode } from 'react';

export interface ModalEntry {
    id: string;
    render: () => ReactNode;
}

type Listener = (entries: ModalEntry[]) => void;

let state: ModalEntry[] = [];
let listeners: Listener[] = [];
let counter = 0;

function emit(): void {
    for (const listener of listeners) listener(state);
}

export const modalStore = {
    subscribe(listener: Listener): () => void {
        listeners.push(listener);

        return () => {
            listeners = listeners.filter((item) => item !== listener);
        };
    },
    snapshot(): ModalEntry[] {
        return state;
    },
    push(entry: Omit<ModalEntry, 'id'>): string {
        counter += 1;
        const id = `m-${counter}`;

        state = [...state, { id, ...entry }];
        emit();

        return id;
    },
    remove(id: string): void {
        state = state.filter((entry) => entry.id !== id);
        emit();
    },
    clear(): void {
        state = [];
        emit();
    },
};
