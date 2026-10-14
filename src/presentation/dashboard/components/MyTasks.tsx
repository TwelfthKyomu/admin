import { EmptyState, Widget, WidgetBody, WidgetHeader } from '@/shared/components/common';
import type { MyTaskView } from '@/contexts/task';
import { ListChecks } from 'lucide-react';
import { TaskRow } from './TaskRow';

interface MyTasksProps {
    tasks: MyTaskView[];
    today: Date;
}

export const MyTasks = ({ tasks, today }: MyTasksProps) => (
    <Widget
        padding="md"
        className="gap-3"
    >
        <WidgetHeader icon={<ListChecks className="size-4" />}>Мои задачи</WidgetHeader>
        <WidgetBody>
            {tasks.length === 0 ? (
                <EmptyState
                    icon={ListChecks}
                    title="Открытых задач на вас нет"
                    description="Задачи, где вы исполнитель, появятся здесь — от ближайшего срока к дальнему."
                    className="py-6"
                />
            ) : (
                <ul className="flex flex-col">
                    {tasks.map((task) => (
                        <TaskRow
                            key={task.id}
                            task={task}
                            today={today}
                        />
                    ))}
                </ul>
            )}
        </WidgetBody>
    </Widget>
);
