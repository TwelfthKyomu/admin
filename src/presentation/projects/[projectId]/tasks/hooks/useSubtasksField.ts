'use client';

import { useState } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import type { TaskFormValues } from '../form/formData';

export function useSubtasksField() {
    const [title, setTitle] = useState('');
    const { control } = useFormContext<TaskFormValues>();

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'subtasks',
    });

    const add = () => {
        const next = title.trim();

        if (!next) return;

        append({ id: '', title: next, done: false });
        setTitle('');
    };

    return { fields, title, setTitle, add, remove };
}
