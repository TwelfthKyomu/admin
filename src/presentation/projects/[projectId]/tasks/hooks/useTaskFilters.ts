'use client';

import { useDeferredValue, useState } from 'react';
import type { TaskPriority } from '@/contexts/task';
import type { TaskFilterValues, TaskSort } from '../lib/tasks';

export type TasksMode = 'board' | 'table';

export function useTaskFilters() {
    const [mode, setMode] = useState<TasksMode>('board');
    const [search, setSearch] = useState('');
    const [priority, setPriority] = useState<TaskPriority | 'all'>('all');
    const [assignee, setAssignee] = useState('all');
    const [sort, setSort] = useState<TaskSort>('priority');

    const values: TaskFilterValues = {
        search: useDeferredValue(search),
        priority,
        assignee,
        sort,
    };

    return {
        values,
        mode,
        setMode,
        search,
        setSearch,
        priority,
        setPriority,
        assignee,
        setAssignee,
        sort,
        setSort,
    };
}

export type TaskFilters = ReturnType<typeof useTaskFilters>;
