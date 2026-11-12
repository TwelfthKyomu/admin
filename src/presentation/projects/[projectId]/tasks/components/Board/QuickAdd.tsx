import { Button, Input } from '@/ui/Base';
import { Plus } from 'lucide-react';
import { useQuickAdd } from '../../hooks/useQuickAdd';

export const QuickAdd = ({ onAdd }: { onAdd: (title: string) => void }) => {
    const { title, setTitle, submit } = useQuickAdd(onAdd);

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
