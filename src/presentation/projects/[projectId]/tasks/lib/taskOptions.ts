import type { Option } from '@/shared/types';
import { TASK_STATUS_VALUES, TaskPriority, TaskStatus } from '@/contexts/task';
import {
    ArrowDown,
    ArrowUp,
    CheckCircle2,
    Circle,
    CircleDashed,
    CircleDot,
    Equal,
    LoaderCircle,
    type LucideIcon,
    Minus,
    OctagonAlert,
} from 'lucide-react';

export interface TaskOptionMeta {
    label: string;
    icon: LucideIcon;
    color: string;
}

export const TASK_STATUS_META: Record<TaskStatus, TaskOptionMeta> = {
    [TaskStatus.BACKLOG]: {
        label: 'Бэклог',
        icon: CircleDashed,
        color: 'var(--muted-foreground)',
    },
    [TaskStatus.TODO]: {
        label: 'К выполнению',
        icon: Circle,
        color: 'var(--muted-foreground)',
    },
    [TaskStatus.IN_PROGRESS]: {
        label: 'В работе',
        icon: LoaderCircle,
        color: '#8b5cf6',
    },
    [TaskStatus.REVIEW]: {
        label: 'На проверке',
        icon: CircleDot,
        color: '#d97706',
    },
    [TaskStatus.DONE]: {
        label: 'Готово',
        icon: CheckCircle2,
        color: '#059669',
    },
};

export const TASK_PRIORITY_META: Record<TaskPriority, TaskOptionMeta> = {
    [TaskPriority.URGENT]: {
        label: 'Срочно',
        icon: OctagonAlert,
        color: '#dc2626',
    },
    [TaskPriority.HIGH]: { label: 'Высокий', icon: ArrowUp, color: '#ea580c' },
    [TaskPriority.MEDIUM]: { label: 'Средний', icon: Equal, color: '#ca8a04' },
    [TaskPriority.LOW]: {
        label: 'Низкий',
        icon: ArrowDown,
        color: 'var(--muted-foreground)',
    },
    [TaskPriority.NONE]: {
        label: 'Без приоритета',
        icon: Minus,
        color: 'var(--muted-foreground)',
    },
};

export const TASK_PRIORITY_ORDER: TaskPriority[] = [
    TaskPriority.URGENT,
    TaskPriority.HIGH,
    TaskPriority.MEDIUM,
    TaskPriority.LOW,
    TaskPriority.NONE,
];

export const TASK_STATUS_OPTIONS = TASK_STATUS_VALUES.map((value) => ({
    value,
    label: TASK_STATUS_META[value].label,
}));

export const TASK_PRIORITY_OPTIONS = TASK_PRIORITY_ORDER.map((value) => ({
    value,
    label: TASK_PRIORITY_META[value].label,
}));

export const PRIORITY_FILTER_OPTIONS: Option<TaskPriority | 'all'>[] = [
    { value: 'all', label: 'Любой приоритет' },
    ...TASK_PRIORITY_OPTIONS,
];
