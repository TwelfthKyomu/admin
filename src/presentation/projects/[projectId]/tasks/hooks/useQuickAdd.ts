import { useState } from 'react';

export const useQuickAdd = (onAdd: (title: string) => void) => {
    const [title, setTitle] = useState('');

    const submit = () => {
        const next = title.trim();

        if (!next) return;

        onAdd(next);
        setTitle('');
    };

    return { title, setTitle, submit };
};
