'use client';

import { useProject } from '@/app/providers';
import { runAction } from '@/shared/lib/action-result';
import { confirmDestructive, modal } from '@/shared/lib/modal';
import type { Option } from '@/shared/types';
import {
    TaskPriority,
    TaskStatus,
    type TaskView,
    useCreateTask,
    useDeleteTask,
    useUpdateTask,
} from '@/contexts/task';
import dynamic from 'next/dynamic';

const TaskCreateModal = dynamic(() =>
    import('../modal/TaskCreateModal').then((m) => m.TaskCreateModal),
);

const TaskEditSheet = dynamic(() => import('../modal/TaskEditSheet').then((m) => m.TaskEditSheet));

export function useTaskActions(assigneeOptions: Option[]) {
    const { projectId } = useProject();
    const create = useCreateTask(projectId);
    const update = useUpdateTask(projectId);
    const remove = useDeleteTask(projectId);

    const onCreate = () =>
        modal.open(
            <TaskCreateModal
                projectId={projectId}
                assigneeOptions={assigneeOptions}
            />,
        );

    const onEdit = (task: TaskView) =>
        modal.open(
            <TaskEditSheet
                projectId={projectId}
                task={task}
                assigneeOptions={assigneeOptions}
            />,
        );

    const onQuickAdd = (title: string, status: TaskStatus) =>
        runAction(create.mutateAsync({ projectId, title, status, priority: TaskPriority.NONE }), {
            success: 'Задача создана',
        });

    const onMove = (id: string, status: TaskStatus) =>
        runAction(update.mutateAsync({ projectId, id, status }));

    const onToggleDone = (task: TaskView) =>
        onMove(task.id, task.status === TaskStatus.DONE ? TaskStatus.TODO : TaskStatus.DONE);

    const onDuplicate = (task: TaskView) =>
        runAction(
            create.mutateAsync({
                projectId,
                title: `${task.title} (копия)`,
                description: task.description,
                status: task.status,
                priority: task.priority,
                assigneeUserId: task.assigneeUserId,
                dueAt: task.dueAt,
                labels: task.labels,
                subtasks: task.subtasks,
            }),
            { success: 'Копия создана' },
        );

    const onDelete = (task: TaskView) =>
        confirmDestructive({
            title: 'Удалить задачу?',
            description: `Задача «${task.title}» будет удалена без возможности восстановления.`,
            success: 'Задача удалена',
            onConfirm: () => remove.mutateAsync({ projectId, id: task.id }),
        });

    return { onCreate, onEdit, onQuickAdd, onMove, onToggleDone, onDuplicate, onDelete };
}

export type TaskActions = ReturnType<typeof useTaskActions>;
