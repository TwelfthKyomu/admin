import { useState } from 'react';
import { Button, Input } from '@/ui/Base';
import { Plus } from 'lucide-react';

export const QuickAdd = ({ onAdd }: { onAdd: (title: string) => void }) => {
    const [title, setTitle] = useState('');

    const submit = () => {
        const next = title.trim();

        if (!next) return;

        onAdd(next);
        setTitle('');
    };

    return (
        <div className="flex gap-1">
            <Input
                value={title}
                placeholder="Новая задача…"
                className="h-8"
                onChange={(event) => setTitle(event.target.value)}
                onKeyDown={(event) => {
                    if (event.key !== 'Enter') return;

                    event.preventDefault();
                    submit();
                }}
            />
            <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Добавить задачу"
                onClick={submit}
            >
                <Plus className="size-4" />
            </Button>
        </div>
    );
};
