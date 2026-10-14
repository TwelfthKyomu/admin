import { TaskStatus, type TaskView } from '@/contexts/task';
import { Button, Dropdown } from '@/ui/Base';
import { CheckCircle2, Copy, Ellipsis, Pencil, Trash2 } from 'lucide-react';
import type { TaskActions } from '../hooks/useTaskActions';

interface TaskMenuProps {
    task: TaskView;
    actions: TaskActions;
}

export const TaskMenu = ({ task, actions }: TaskMenuProps) => (
    <Dropdown
        trigger={
            <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label="Действия"
                className="opacity-70 group-hover:opacity-100"
            >
                <Ellipsis className="size-4" />
            </Button>
        }
    >
        <Dropdown.Item onClick={() => actions.onEdit(task)}>
            <Pencil className="size-4" />
            Открыть
        </Dropdown.Item>
        <Dropdown.Item onClick={() => actions.onToggleDone(task)}>
            <CheckCircle2 className="size-4" />
            {task.status === TaskStatus.DONE ? 'Снять готовность' : 'Отметить готовой'}
        </Dropdown.Item>
        <Dropdown.Item onClick={() => actions.onDuplicate(task)}>
            <Copy className="size-4" />
            Дублировать
        </Dropdown.Item>
        <Dropdown.Separator />
        <Dropdown.Item
            variant="destructive"
            onClick={() => actions.onDelete(task)}
        >
            <Trash2 className="size-4" />
            Удалить
        </Dropdown.Item>
    </Dropdown>
);
