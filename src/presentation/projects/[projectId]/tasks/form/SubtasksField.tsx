'use client';

import { Button, Field, FieldLabel, Input } from '@/ui/Base';
import { Checkbox } from '@/ui/Controlled';
import { Plus, X } from 'lucide-react';
import { useSubtasksField } from '../hooks/useSubtasksField';

export const SubtasksField = () => {
    const { fields, title, setTitle, add, remove } = useSubtasksField();

    return (
        <Field>
            <FieldLabel>Подзадачи</FieldLabel>
            {fields.map((field, index) => (
                <div
                    key={field.id}
                    className="flex items-center gap-2 rounded-md border px-2 py-1.5"
                >
                    <Checkbox
                        name={`subtasks.${index}.done`}
                        label={field.title}
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        aria-label="Удалить подзадачу"
                        className="ml-auto"
                        onClick={() => remove(index)}
                    >
                        <X className="size-4" />
                    </Button>
                </div>
            ))}
            <div className="flex gap-2">
                <Input
                    value={title}
                    placeholder="Новая подзадача…"
                    onChange={(event) => setTitle(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key !== 'Enter') return;

                        event.preventDefault();
                        add();
                    }}
                />
                <Button
                    type="button"
                    variant="outline"
                    aria-label="Добавить подзадачу"
                    onClick={add}
                >
                    <Plus className="size-4" />
                </Button>
            </div>
        </Field>
    );
};
